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

const maxArtworkImageSize int64 = 10 << 20 // 10 MB

var allowedImageTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

type UploadedArtworkImage struct {
	OriginalURL    string
	ThumbURL       string
	ThumbWebPURL   string
	ThumbAVIFURL   string
	DisplayURL     string
	DisplayWebPURL string
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
		return nil, fmt.Errorf("%w: image must be non-empty and no larger than 10 MB", domain.ErrValidation)
	}

	data, err := io.ReadAll(io.LimitReader(file, maxArtworkImageSize+1))
	if err != nil {
		return nil, fmt.Errorf("%w: failed to read image", domain.ErrValidation)
	}
	if int64(len(data)) > maxArtworkImageSize {
		return nil, fmt.Errorf("%w: image is larger than 10 MB", domain.ErrValidation)
	}

	contentType, ext, ok := detectImageType(data)
	if !ok {
		return nil, fmt.Errorf("%w: only JPEG, PNG and WebP images are allowed", domain.ErrValidation)
	}

	processed, err := s.processor.Generate(ctx, data, contentType)
	if err != nil {
		return nil, fmt.Errorf("%w: invalid or oversized image: %v", domain.ErrValidation, err)
	}

	timestamp := time.Now().UnixNano()
	originalKey := fmt.Sprintf("artworks/%d/%d%s", artworkID, timestamp, ext)
	originalURL, err := s.put(ctx, originalKey, data, contentType)
	if err != nil {
		return nil, err
	}
	result := &UploadedArtworkImage{OriginalURL: originalURL, ThumbURL: originalURL}
	if processed.ReuseOriginalForDisplay {
		result.DisplayURL = originalURL
		if contentType == "image/webp" {
			result.DisplayWebPURL = originalURL
		}
	}

	thumbnailKey := fmt.Sprintf("artworks/%d/%d_thumb%s", artworkID, timestamp, processed.Thumbnail.Extension)
	if url, err := s.put(ctx, thumbnailKey, processed.Thumbnail.Data, processed.Thumbnail.ContentType); err == nil {
		result.ThumbURL = url
	}

	if len(processed.ThumbnailWebP) > 0 {
		webpKey := fmt.Sprintf("artworks/%d/%d_thumb.webp", artworkID, timestamp)
		if url, err := s.put(ctx, webpKey, processed.ThumbnailWebP, "image/webp"); err == nil {
			result.ThumbWebPURL = url
		}
	}

	if len(processed.ThumbnailAVIF) > 0 {
		avifKey := fmt.Sprintf("artworks/%d/%d_thumb.avif", artworkID, timestamp)
		if url, err := s.put(ctx, avifKey, processed.ThumbnailAVIF, "image/avif"); err == nil {
			result.ThumbAVIFURL = url
		}
	}

	// Display variants (~3200px) are what the public carousel serves instead of
	// the original. On failure the frontend falls back to the original.
	if !processed.ReuseOriginalForDisplay && len(processed.Display.Data) > 0 {
		displayKey := fmt.Sprintf("artworks/%d/%d_display%s", artworkID, timestamp, processed.Display.Extension)
		if url, err := s.put(ctx, displayKey, processed.Display.Data, processed.Display.ContentType); err == nil {
			result.DisplayURL = url
		}
	}

	if !processed.ReuseOriginalForDisplay && len(processed.DisplayWebP) > 0 {
		displayWebPKey := fmt.Sprintf("artworks/%d/%d_display.webp", artworkID, timestamp)
		if url, err := s.put(ctx, displayWebPKey, processed.DisplayWebP, "image/webp"); err == nil {
			result.DisplayWebPURL = url
		}
	}

	return result, nil
}

func (s *StorageService) UploadArtistImage(ctx context.Context, slot string, file multipart.File, header *multipart.FileHeader) (string, error) {
	if header.Size <= 0 || header.Size > maxArtworkImageSize {
		return "", fmt.Errorf("%w: image must be non-empty and no larger than 10 MB", domain.ErrValidation)
	}

	data, err := io.ReadAll(io.LimitReader(file, maxArtworkImageSize+1))
	if err != nil {
		return "", fmt.Errorf("%w: failed to read image", domain.ErrValidation)
	}
	if int64(len(data)) > maxArtworkImageSize {
		return "", fmt.Errorf("%w: image is larger than 10 MB", domain.ErrValidation)
	}

	contentType, ext, ok := detectImageType(data)
	if !ok {
		return "", fmt.Errorf("%w: only JPEG, PNG and WebP images are allowed", domain.ErrValidation)
	}
	if err := s.processor.Validate(data); err != nil {
		return "", fmt.Errorf("%w: invalid or oversized image: %v", domain.ErrValidation, err)
	}

	safeSlot := "default"
	if slot == "home" || slot == "about" {
		safeSlot = slot
	}

	key := fmt.Sprintf("artist/%s_%d%s", safeSlot, time.Now().UnixNano(), ext)
	return s.put(ctx, key, data, contentType)
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

	// Object keys are timestamped and never rewritten, so aggressive immutable
	// caching is safe. Without Cache-Control the S3 endpoint sends none, and
	// browsers fall back to heuristic caching — visitors re-download images on
	// almost every visit.
	_, err := s.client.PutObject(ctx, s.bucket, key, bytes.NewReader(data), int64(len(data)), minio.PutObjectOptions{
		ContentType:  contentType,
		CacheControl: "public, max-age=31536000, immutable",
	})
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
		relativePath, ok := strings.CutPrefix(objectURL, "/uploads/")
		if !ok {
			return fmt.Errorf("refusing to delete an object outside the upload directory")
		}
		cleanPath := filepath.Clean(filepath.FromSlash(relativePath))
		if cleanPath == "." || filepath.IsAbs(cleanPath) || cleanPath == ".." || strings.HasPrefix(cleanPath, ".."+string(filepath.Separator)) {
			return fmt.Errorf("refusing to delete an invalid upload path")
		}
		path := filepath.Join(s.uploadDir, cleanPath)
		err := os.Remove(path)
		if errors.Is(err, os.ErrNotExist) {
			return nil
		}
		return err
	}
	prefix := strings.TrimRight(s.publicURL, "/") + "/"
	key, ok := strings.CutPrefix(objectURL, prefix)
	if !ok || key == "" || strings.Contains(key, "..") {
		return fmt.Errorf("refusing to delete an object outside the configured bucket URL")
	}
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
