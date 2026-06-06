package service

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	_ "image/png" // register PNG decoder for image.Decode
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/midfinup1/li.polesh-Store/backend/config"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

const (
	maxArtworkImageSize int64 = 20 << 20 // 20 MB
	thumbnailMaxDim           = 800       // longest side of generated thumbnails, px
	thumbnailJPEGQuality      = 82
)

var allowedImageTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

type StorageService struct {
	client                       *minio.Client
	bucket, publicURL, uploadDir string
}

func NewStorageService(cfg config.S3Config) *StorageService {
	if cfg.Endpoint == "" {
		return &StorageService{uploadDir: cfg.UploadDir}
	}
	client, err := minio.New(cfg.Endpoint, &minio.Options{Creds: credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""), Secure: true, Region: cfg.Region})
	if err != nil {
		panic(fmt.Sprintf("failed to create S3 client: %v", err))
	}
	return &StorageService{client: client, bucket: cfg.Bucket, publicURL: cfg.PublicURL, uploadDir: cfg.UploadDir}
}

// UploadArtworkImage validates the upload, stores the original, and stores a
// JPEG thumbnail. For JPEG/PNG a real downscaled thumbnail is produced; for
// WebP (which the standard library cannot decode) the original URL is reused as
// the thumbnail so the API contract still holds.
func (s *StorageService) UploadArtworkImage(ctx context.Context, artworkID int64, file multipart.File, header *multipart.FileHeader) (string, string, error) {
	if header.Size <= 0 || header.Size > maxArtworkImageSize {
		return "", "", fmt.Errorf("%w: image must be non-empty and no larger than 20 MB", domain.ErrValidation)
	}

	data, err := io.ReadAll(io.LimitReader(file, maxArtworkImageSize+1))
	if err != nil {
		return "", "", fmt.Errorf("%w: failed to read image", domain.ErrValidation)
	}
	if int64(len(data)) > maxArtworkImageSize {
		return "", "", fmt.Errorf("%w: image is larger than 20 MB", domain.ErrValidation)
	}

	contentType, ext, ok := detectImageType(data)
	if !ok {
		return "", "", fmt.Errorf("%w: only JPEG, PNG and WebP images are allowed", domain.ErrValidation)
	}

	timestamp := time.Now().UnixNano()
	originalKey := fmt.Sprintf("artworks/%d/%d%s", artworkID, timestamp, ext)
	originalURL, err := s.put(ctx, originalKey, data, contentType)
	if err != nil {
		return "", "", err
	}

	thumbURL := originalURL
	if thumb, made := makeThumbnail(data, contentType); made {
		thumbKey := fmt.Sprintf("artworks/%d/%d_thumb.jpg", artworkID, timestamp)
		if url, err := s.put(ctx, thumbKey, thumb, "image/jpeg"); err == nil {
			thumbURL = url
		}
		// On thumbnail failure we keep the original as the thumbnail rather than
		// failing the whole upload.
	}

	return originalURL, thumbURL, nil
}

// put writes an object either to the local upload dir (development) or to the
// S3-compatible bucket (production), returning its public URL.
func (s *StorageService) put(ctx context.Context, key string, data []byte, contentType string) (string, error) {
	if s.client == nil {
		destination := filepath.Join(s.uploadDir, filepath.FromSlash(key))
		if err := os.MkdirAll(filepath.Dir(destination), 0o755); err != nil {
			return "", err
		}
		if err := os.WriteFile(destination, data, 0o644); err != nil {
			return "", err
		}
		return "/uploads/" + key, nil
	}

	_, err := s.client.PutObject(ctx, s.bucket, key, bytes.NewReader(data), int64(len(data)), minio.PutObjectOptions{ContentType: contentType})
	if err != nil {
		return "", fmt.Errorf("upload failed: %w", err)
	}
	return strings.TrimRight(s.publicURL, "/") + "/" + key, nil
}

func (s *StorageService) Delete(ctx context.Context, objectURL string) error {
	if objectURL == "" {
		return nil
	}
	if s.client == nil {
		path := filepath.Join(s.uploadDir, filepath.FromSlash(strings.TrimPrefix(objectURL, "/uploads/")))
		err := os.Remove(path)
		if errors.Is(err, os.ErrNotExist) {
			return nil
		}
		return err
	}
	key := strings.TrimPrefix(objectURL, strings.TrimRight(s.publicURL, "/")+"/")
	return s.client.RemoveObject(ctx, s.bucket, key, minio.RemoveObjectOptions{})
}

// detectImageType returns the MIME type and extension for supported images.
// It uses http.DetectContentType but adds an explicit RIFF/WEBP check, because
// some Go versions did not sniff WebP — without this, valid .webp uploads could
// be silently rejected.
func detectImageType(data []byte) (string, string, bool) {
	if isWebP(data) {
		return "image/webp", ".webp", true
	}
	contentType := http.DetectContentType(data)
	ext, ok := allowedImageTypes[contentType]
	if !ok {
		return "", "", false
	}
	return contentType, ext, true
}

func isWebP(data []byte) bool {
	return len(data) >= 12 &&
		bytes.Equal(data[0:4], []byte("RIFF")) &&
		bytes.Equal(data[8:12], []byte("WEBP"))
}

// makeThumbnail decodes JPEG/PNG, downscales so the longest side is at most
// thumbnailMaxDim, and re-encodes as JPEG. WebP is not decodable by the stdlib,
// so it returns made=false and the caller reuses the original.
func makeThumbnail(data []byte, contentType string) ([]byte, bool) {
	if contentType == "image/webp" {
		return nil, false
	}
	src, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, false
	}
	thumb := downscale(src, thumbnailMaxDim)
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, thumb, &jpeg.Options{Quality: thumbnailJPEGQuality}); err != nil {
		return nil, false
	}
	return buf.Bytes(), true
}

// downscale performs an area-average (box filter) downscale, which gives clean
// thumbnails without external dependencies. Images already within bounds are
// returned unchanged. Each source pixel is visited at most once, so cost is
// O(width*height).
func downscale(src image.Image, maxDim int) image.Image {
	b := src.Bounds()
	sw, sh := b.Dx(), b.Dy()
	if sw <= 0 || sh <= 0 {
		return src
	}
	if sw <= maxDim && sh <= maxDim {
		return src
	}

	longest := sw
	if sh > longest {
		longest = sh
	}
	scale := float64(maxDim) / float64(longest)
	tw := int(float64(sw) * scale)
	th := int(float64(sh) * scale)
	if tw < 1 {
		tw = 1
	}
	if th < 1 {
		th = 1
	}

	dst := image.NewRGBA(image.Rect(0, 0, tw, th))
	for y := 0; y < th; y++ {
		sy0 := y * sh / th
		sy1 := (y + 1) * sh / th
		if sy1 <= sy0 {
			sy1 = sy0 + 1
		}
		for x := 0; x < tw; x++ {
			sx0 := x * sw / tw
			sx1 := (x + 1) * sw / tw
			if sx1 <= sx0 {
				sx1 = sx0 + 1
			}
			var rSum, gSum, bSum, count uint64
			for sy := sy0; sy < sy1; sy++ {
				for sx := sx0; sx < sx1; sx++ {
					cr, cg, cb, _ := src.At(b.Min.X+sx, b.Min.Y+sy).RGBA()
					rSum += uint64(cr >> 8)
					gSum += uint64(cg >> 8)
					bSum += uint64(cb >> 8)
					count++
				}
			}
			if count == 0 {
				count = 1
			}
			dst.Set(x, y, color.RGBA{
				R: uint8(rSum / count),
				G: uint8(gSum / count),
				B: uint8(bSum / count),
				A: 255,
			})
		}
	}
	return dst
}
