package service

import (
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
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

const maxArtworkImageSize int64 = 20 << 20

var allowedImageTypes = map[string]string{"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}

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

func (s *StorageService) UploadArtworkImage(ctx context.Context, artworkID int64, file multipart.File, header *multipart.FileHeader) (string, string, error) {
	if header.Size <= 0 || header.Size > maxArtworkImageSize {
		return "", "", errors.New("image must be non-empty and no larger than 20 MB")
	}
	probe := make([]byte, 512)
	n, err := file.Read(probe)
	if err != nil && err != io.EOF {
		return "", "", errors.New("failed to read image")
	}
	contentType := http.DetectContentType(probe[:n])
	ext, ok := allowedImageTypes[contentType]
	if !ok {
		return "", "", errors.New("only JPEG, PNG and WebP images are allowed")
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", "", errors.New("failed to reset image stream")
	}
	key := fmt.Sprintf("artworks/%d/%d%s", artworkID, time.Now().UnixNano(), ext)
	if s.client == nil {
		destination := filepath.Join(s.uploadDir, filepath.FromSlash(key))
		if err := os.MkdirAll(filepath.Dir(destination), 0o755); err != nil {
			return "", "", err
		}
		out, err := os.Create(destination)
		if err != nil {
			return "", "", err
		}
		defer out.Close()
		if _, err := io.Copy(out, file); err != nil {
			return "", "", err
		}
		url := "/uploads/" + key
		return url, url, nil
	}
	_, err = s.client.PutObject(ctx, s.bucket, key, file, header.Size, minio.PutObjectOptions{ContentType: contentType})
	if err != nil {
		return "", "", fmt.Errorf("upload failed: %w", err)
	}
	url := strings.TrimRight(s.publicURL, "/") + "/" + key
	return url, url, nil
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
