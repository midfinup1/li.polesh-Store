package service

import (
	"bytes"
	"context"
	"image"
	"image/color"
	"image/png"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/midfinup1/li.polesh-Store/backend/config"
)

func TestUploadArtworkImagePreservesTransparentPNG(t *testing.T) {
	source := image.NewNRGBA(image.Rect(0, 0, 8, 8))
	source.SetNRGBA(4, 4, color.NRGBA{R: 220, G: 40, B: 80, A: 255})

	var encoded bytes.Buffer
	if err := png.Encode(&encoded, source); err != nil {
		t.Fatalf("encode source png: %v", err)
	}

	uploadDir := t.TempDir()
	inputPath := filepath.Join(t.TempDir(), "transparent.png")
	if err := os.WriteFile(inputPath, encoded.Bytes(), 0o600); err != nil {
		t.Fatalf("write source png: %v", err)
	}

	file, err := os.Open(inputPath)
	if err != nil {
		t.Fatalf("open source png: %v", err)
	}
	defer file.Close()

	storage := NewStorageService(config.S3Config{UploadDir: uploadDir})
	result, err := storage.UploadArtworkImage(context.Background(), 42, file, &multipart.FileHeader{
		Filename: "transparent.png",
		Size:     int64(encoded.Len()),
	})
	if err != nil {
		t.Fatalf("UploadArtworkImage() error = %v", err)
	}

	if !strings.HasSuffix(result.ThumbURL, "_thumb.png") {
		t.Fatalf("ThumbURL = %q, want transparent PNG thumbnail", result.ThumbURL)
	}
	if result.DisplayURL != result.OriginalURL {
		t.Fatalf("DisplayURL = %q, want reused original %q", result.DisplayURL, result.OriginalURL)
	}

	thumbPath := filepath.Join(uploadDir, filepath.FromSlash(strings.TrimPrefix(result.ThumbURL, "/uploads/")))
	thumbFile, err := os.Open(thumbPath)
	if err != nil {
		t.Fatalf("open thumbnail: %v", err)
	}
	defer thumbFile.Close()

	thumbnail, err := png.Decode(thumbFile)
	if err != nil {
		t.Fatalf("decode thumbnail: %v", err)
	}
	_, _, _, alpha := thumbnail.At(0, 0).RGBA()
	if alpha != 0 {
		t.Fatalf("thumbnail transparent pixel alpha = %d, want 0", alpha)
	}
}
