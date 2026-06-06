package service

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/midfinup1/li.polesh-Store/backend/config"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
	"github.com/midfinup1/li.polesh-Store/backend/internal/imageprocessor"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

const maxArtworkImageSize int64 = 20 << 20 // 20 MB

var allowedImageTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

type UploadedArtworkImage struct {
	OriginalURL  string
	ThumbURL     string
	ThumbWebPURL string
	ThumbAVIFURL string
}

type StorageService struct {
	client                       *minio.Client
	bucket, publicURL, uploadDir string
	processor                    *imageprocessor.Processor
}

func NewStorageService(cfg config.S3Config) *StorageService {
	storage := &StorageService{uploadDir: cfg.UploadDir, processor: imageprocessor.New()}
	if cfg.Endpoint == "" {
		return storage
	}
	client, err := minio.New(cfg.Endpoint, &minio.Options{Creds: credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""), Secure: true, Region: cfg.Region})
	if err != nil {
		panic(fmt.Sprintf("failed to create S3 client: %v", err))
	}
	storage.client = client
	storage.bucket = cfg.Bucket
	storage.publicURL = cfg.PublicURL
	return storage
}

func (s *StorageService) UploadArtworkImage(ctx context.Context, artworkID int64, file multipart.File, header *multipart.FileHeader) (*UploadedArtworkImage, error) {
	if header.Size <= 0 || header.Size > maxArtworkImageSize {
		return nil, fmt.Errorf("%w: image must be non-empty and no larger than 20 MB", domain.ErrValidation)
	}

	data, err := io.ReadAll(io.LimitReader(file, maxArtworkImageSize+1))
	if err != nil {
		return nil, fmt.Errorf("%w: failed to read image", domain.ErrValidation)
	}
	if int64(len(data)) > maxArtworkImageSize {
		return nil, fmt.Errorf("%w: image is larger than 20 MB", domain.ErrValidation)
	}

	contentType, ext, ok := detectImageType(data)
	if !ok {
		return nil, fmt.Errorf("%w: only JPEG, PNG and WebP images are allowed", domain.ErrValidation)
	}

	timestamp := time.Now().UnixNano()
	originalKey := fmt.Sprintf("artworks/%d/%d%s", artworkID, timestamp, ext)
	originalURL, err := s.put(ctx, originalKey, data, contentType)
	if err != nil {
		return nil, err
	}

	result := &UploadedArtworkImage{OriginalURL: originalURL, ThumbURL: originalURL}

	thumbs, err := s.processor.Generate(ctx, data, contentType)
	if err != nil {
		return result, nil
	}

	jpegKey := fmt.Sprintf("artworks/%d/%d_thumb.jpg", artworkID, timestamp)
	if url, err := s.put(ctx, jpegKey, thumbs.JPEG, "image/jpeg"); err == nil {
		result.ThumbURL = url
	}

	if len(thumbs.WebP) > 0 {
		webpKey := fmt.Sprintf("artworks/%d/%d_thumb.webp", artworkID, timestamp)
		if url, err := s.put(ctx, webpKey, thumbs.WebP, "image/webp"); err == nil {
			result.ThumbWebPURL = url
		}
	}

	if len(thumbs.AVIF) > 0 {
		avifKey := fmt.Sprintf("artworks/%d/%d_thumb.avif", artworkID, timestamp)
		if url, err := s.put(ctx, avifKey, thumbs.AVIF, "image/avif"); err == nil {
			result.ThumbAVIFURL = url
		}
	}

	return result, nil
}

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
