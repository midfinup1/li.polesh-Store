package imageprocessor

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"golang.org/x/image/draw"
	_ "golang.org/x/image/webp"
)

const (
	ThumbnailMaxDim      = 1200
	ThumbnailJPEGQuality = 92
	ThumbnailWebPQuality = 90
	MaxImageDimension    = 20000
	MaxImagePixels       = 60_000_000

	// Display variants are what the public artwork page serves instead of
	// multi-megabyte originals. 3200px leaves ample detail for large and retina
	// displays while remaining substantially lighter than camera originals.
	DisplayMaxDim      = 3200
	DisplayJPEGQuality = 95
	DisplayWebPQuality = 94

	MaxOriginalDisplayBytes = 2 << 20
)

type EncodedImage struct {
	Data        []byte
	Extension   string
	ContentType string
}

type Result struct {
	Thumbnail     EncodedImage
	ThumbnailWebP []byte
	ThumbnailAVIF []byte

	// Small, screen-sized originals need no additional lossy encoding. For
	// larger originals Display is always present; WebP may be empty when cwebp
	// is unavailable.
	ReuseOriginalForDisplay bool
	Display                 EncodedImage
	DisplayWebP             []byte
}

type Processor struct {
	MaxDim      int
	JPEGQuality int
}

func New() *Processor {
	return &Processor{
		MaxDim:      ThumbnailMaxDim,
		JPEGQuality: ThumbnailJPEGQuality,
	}
}

func (p *Processor) Generate(ctx context.Context, data []byte, _ string) (*Result, error) {
	if err := p.Validate(data); err != nil {
		return nil, err
	}

	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("decode image: %w", err)
	}

	thumb := downscale(img, p.MaxDim)

	thumbnail, thumbLossless, err := encodeFallbackAndLossless(thumb, p.JPEGQuality)
	if err != nil {
		return nil, err
	}

	webpBytes, _ := encodeWebPQuality(ctx, thumbLossless, ThumbnailWebPQuality)
	avifBytes, _ := encodeAVIF(ctx, thumbLossless)
	result := &Result{
		Thumbnail:     thumbnail,
		ThumbnailWebP: webpBytes,
		ThumbnailAVIF: avifBytes,
	}

	if shouldReuseOriginalForDisplay(img, len(data)) {
		result.ReuseOriginalForDisplay = true
		return result, nil
	}

	// Display variant reuses the already-decoded image (no second decode of a
	// potentially 10MB original). AVIF is intentionally skipped here: avifenc
	// on display-size inputs is too slow for a synchronous upload path, and
	// a high-quality fallback plus WebP already gives the bulk of the savings.
	display := downscale(img, DisplayMaxDim)
	displayFallback, displayLossless, err := encodeFallbackAndLossless(display, DisplayJPEGQuality)
	if err != nil {
		return nil, err
	}
	displayWebP, _ := encodeWebPQuality(ctx, displayLossless, DisplayWebPQuality)

	result.Display = displayFallback
	result.DisplayWebP = displayWebP
	return result, nil
}

func shouldReuseOriginalForDisplay(img image.Image, byteLength int) bool {
	bounds := img.Bounds()
	return bounds.Dx() <= DisplayMaxDim &&
		bounds.Dy() <= DisplayMaxDim &&
		byteLength <= MaxOriginalDisplayBytes
}

func (p *Processor) Validate(data []byte) error {
	config, _, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("decode image config: %w", err)
	}
	return validateDimensions(config.Width, config.Height)
}

func validateDimensions(width int, height int) error {
	if width <= 0 || height <= 0 {
		return errors.New("image dimensions must be positive")
	}
	if width > MaxImageDimension || height > MaxImageDimension {
		return fmt.Errorf("image dimensions exceed %d pixels", MaxImageDimension)
	}
	if int64(width)*int64(height) > MaxImagePixels {
		return fmt.Errorf("image contains more than %d pixels", MaxImagePixels)
	}
	return nil
}

func encodeJPEG(img image.Image, quality int) ([]byte, error) {
	var buf bytes.Buffer

	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality}); err != nil {
		return nil, fmt.Errorf("encode jpeg thumbnail: %w", err)
	}

	return buf.Bytes(), nil
}

func encodePNG(img image.Image) ([]byte, error) {
	var buf bytes.Buffer

	encoder := png.Encoder{CompressionLevel: png.DefaultCompression}
	if err := encoder.Encode(&buf, img); err != nil {
		return nil, fmt.Errorf("encode png image: %w", err)
	}

	return buf.Bytes(), nil
}

func encodeFallbackAndLossless(img image.Image, jpegQuality int) (EncodedImage, []byte, error) {
	lossless, err := encodePNG(img)
	if err != nil {
		return EncodedImage{}, nil, err
	}

	if hasTransparency(img) {
		return EncodedImage{
			Data:        lossless,
			Extension:   ".png",
			ContentType: "image/png",
		}, lossless, nil
	}

	jpegData, err := encodeJPEG(img, jpegQuality)
	if err != nil {
		return EncodedImage{}, nil, err
	}

	return EncodedImage{
		Data:        jpegData,
		Extension:   ".jpg",
		ContentType: "image/jpeg",
	}, lossless, nil
}

func hasTransparency(img image.Image) bool {
	type opaqueImage interface {
		Opaque() bool
	}

	if opaque, ok := img.(opaqueImage); ok {
		return !opaque.Opaque()
	}

	bounds := img.Bounds()
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			_, _, _, alpha := img.At(x, y).RGBA()
			if alpha != 0xffff {
				return true
			}
		}
	}

	return false
}

func encodeWebPQuality(ctx context.Context, inputData []byte, quality int) ([]byte, error) {
	return encodeWithCLI(
		ctx,
		"cwebp",
		[]string{"-quiet", "-q", fmt.Sprintf("%d", quality), "-alpha_q", "100", "-exact"},
		".png",
		".webp",
		inputData,
		func(args []string, input string, output string) []string {
			args = append(args, input)
			args = append(args, "-o", output)
			return args
		},
	)
}

func encodeAVIF(ctx context.Context, inputData []byte) ([]byte, error) {
	return encodeWithCLI(
		ctx,
		"avifenc",
		[]string{"--min", "20", "--max", "28", "--speed", "6"},
		".png",
		".avif",
		inputData,
		func(args []string, input string, output string) []string {
			args = append(args, input, output)
			return args
		},
	)
}

func encodeWithCLI(
	ctx context.Context,
	binary string,
	args []string,
	inputExt string,
	outputExt string,
	inputData []byte,
	buildArgs func(args []string, input string, output string) []string,
) ([]byte, error) {
	if _, err := exec.LookPath(binary); err != nil {
		return nil, err
	}

	tmpDir, err := os.MkdirTemp("", "artist-image-*")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(tmpDir)

	input := filepath.Join(tmpDir, "thumb"+inputExt)
	output := filepath.Join(tmpDir, "thumb"+outputExt)

	if err := os.WriteFile(input, inputData, 0o600); err != nil {
		return nil, err
	}

	cmdCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	cmdArgs := buildArgs(append([]string{}, args...), input, output)

	cmd := exec.CommandContext(cmdCtx, binary, cmdArgs...)

	stderr := bytes.Buffer{}
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		if errors.Is(cmdCtx.Err(), context.DeadlineExceeded) {
			return nil, cmdCtx.Err()
		}

		return nil, fmt.Errorf("%s failed: %w: %s", binary, err, stderr.String())
	}

	outputData, err := os.ReadFile(output)
	if err != nil {
		return nil, fmt.Errorf("read %s output: %w", binary, err)
	}

	if len(outputData) == 0 {
		return nil, fmt.Errorf("%s produced empty output", binary)
	}

	return outputData, nil
}

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
	draw.CatmullRom.Scale(dst, dst.Bounds(), src, b, draw.Src, nil)

	return dst
}
