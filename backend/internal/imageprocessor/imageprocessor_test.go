package imageprocessor

import (
	"bytes"
	"context"
	"image"
	"image/color"
	"image/png"
	"os/exec"
	"testing"
)

func TestValidateDimensions(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		width   int
		height  int
		wantErr bool
	}{
		{name: "normal camera image", width: 8000, height: 6000},
		{name: "zero width", width: 0, height: 100, wantErr: true},
		{name: "dimension too large", width: MaxImageDimension + 1, height: 1, wantErr: true},
		{name: "too many pixels", width: 10000, height: 7000, wantErr: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := validateDimensions(test.width, test.height)
			if (err != nil) != test.wantErr {
				t.Fatalf("validateDimensions(%d, %d) error = %v, wantErr %v", test.width, test.height, err, test.wantErr)
			}
		})
	}
}

func TestGeneratePreservesTransparentFallback(t *testing.T) {
	source := image.NewNRGBA(image.Rect(0, 0, 4, 4))
	source.SetNRGBA(1, 1, color.NRGBA{R: 220, G: 40, B: 80, A: 255})

	var input bytes.Buffer
	if err := png.Encode(&input, source); err != nil {
		t.Fatalf("encode source png: %v", err)
	}

	result, err := New().Generate(context.Background(), input.Bytes(), "image/png")
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}

	if result.Thumbnail.ContentType != "image/png" || result.Thumbnail.Extension != ".png" {
		t.Fatalf("thumbnail fallback = %s %s, want transparent PNG", result.Thumbnail.ContentType, result.Thumbnail.Extension)
	}
	if !result.ReuseOriginalForDisplay {
		t.Fatal("small transparent original should be reused for display")
	}

	decoded, err := png.Decode(bytes.NewReader(result.Thumbnail.Data))
	if err != nil {
		t.Fatalf("decode thumbnail fallback: %v", err)
	}
	_, _, _, alpha := decoded.At(0, 0).RGBA()
	if alpha != 0 {
		t.Fatalf("transparent pixel alpha = %d, want 0", alpha)
	}

	if _, err := exec.LookPath("cwebp"); err == nil {
		if len(result.ThumbnailWebP) == 0 {
			t.Fatal("cwebp is available but transparent WebP was not generated")
		}
		decodedWebP, _, err := image.Decode(bytes.NewReader(result.ThumbnailWebP))
		if err != nil {
			t.Fatalf("decode transparent WebP: %v", err)
		}
		_, _, _, webPAlpha := decodedWebP.At(0, 0).RGBA()
		if webPAlpha != 0 {
			t.Fatalf("transparent WebP pixel alpha = %d, want 0", webPAlpha)
		}
	}

	if _, err := exec.LookPath("avifenc"); err == nil && len(result.ThumbnailAVIF) == 0 {
		t.Fatal("avifenc is available but transparent AVIF was not generated")
	}
}

func TestGenerateUsesJPEGFallbackForOpaqueImage(t *testing.T) {
	source := image.NewNRGBA(image.Rect(0, 0, 4, 4))
	for y := 0; y < 4; y++ {
		for x := 0; x < 4; x++ {
			source.SetNRGBA(x, y, color.NRGBA{R: 60, G: 120, B: 180, A: 255})
		}
	}

	var input bytes.Buffer
	if err := png.Encode(&input, source); err != nil {
		t.Fatalf("encode source png: %v", err)
	}

	result, err := New().Generate(context.Background(), input.Bytes(), "image/png")
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}

	if result.Thumbnail.ContentType != "image/jpeg" || result.Thumbnail.Extension != ".jpg" {
		t.Fatalf("thumbnail fallback = %s %s, want JPEG", result.Thumbnail.ContentType, result.Thumbnail.Extension)
	}
	if !result.ReuseOriginalForDisplay {
		t.Fatal("small opaque original should be reused for display")
	}
}

func TestShouldReuseOriginalForDisplay(t *testing.T) {
	t.Parallel()

	if !shouldReuseOriginalForDisplay(image.NewRGBA(image.Rect(0, 0, 1600, 1200)), 500_000) {
		t.Fatal("screen-sized lightweight original should be reused")
	}
	if shouldReuseOriginalForDisplay(image.NewRGBA(image.Rect(0, 0, DisplayMaxDim+1, 1)), 500_000) {
		t.Fatal("oversized original should get a display variant")
	}
	if shouldReuseOriginalForDisplay(image.NewRGBA(image.Rect(0, 0, 1600, 1200)), MaxOriginalDisplayBytes+1) {
		t.Fatal("heavy original should get a display variant")
	}
}
