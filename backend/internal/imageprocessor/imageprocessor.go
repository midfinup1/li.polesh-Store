package imageprocessor

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	_ "image/png"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	_ "golang.org/x/image/webp"
)

const (
	ThumbnailMaxDim      = 800
	ThumbnailJPEGQuality = 82

	// Display variants are what the public artwork page (carousel) serves
	// instead of multi-megabyte originals: 1600px covers retina laptops at the
	// carousel's max width while staying ~200-400KB as JPEG.
	DisplayMaxDim      = 1600
	DisplayJPEGQuality = 85
)

type Result struct {
	JPEG []byte
	WebP []byte
	AVIF []byte

	// Display-size variants (DisplayMaxDim). WebP may be empty when the cwebp
	// binary is unavailable; JPEG is always present on success.
	DisplayJPEG []byte
	DisplayWebP []byte
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
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("decode image: %w", err)
	}

	thumb := downscale(img, p.MaxDim)

	jpegBytes, err := encodeJPEG(thumb, p.JPEGQuality)
	if err != nil {
		return nil, err
	}

	webpBytes, _ := encodeWebP(ctx, jpegBytes)
	avifBytes, _ := encodeAVIF(ctx, jpegBytes)

	// Display variant reuses the already-decoded image (no second decode of a
	// potentially 10MB original). AVIF is intentionally skipped here: avifenc
	// on 1600px inputs is too slow for a synchronous upload path, and JPEG+WebP
	// already give the bulk of the savings.
	display := downscale(img, DisplayMaxDim)
	displayJPEG, err := encodeJPEG(display, DisplayJPEGQuality)
	if err != nil {
		return nil, err
	}
	displayWebP, _ := encodeWebP(ctx, displayJPEG)

	return &Result{
		JPEG:        jpegBytes,
		WebP:        webpBytes,
		AVIF:        avifBytes,
		DisplayJPEG: displayJPEG,
		DisplayWebP: displayWebP,
	}, nil
}

func encodeJPEG(img image.Image, quality int) ([]byte, error) {
	var buf bytes.Buffer

	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality}); err != nil {
		return nil, fmt.Errorf("encode jpeg thumbnail: %w", err)
	}

	return buf.Bytes(), nil
}

func encodeWebP(ctx context.Context, inputData []byte) ([]byte, error) {
	return encodeWithCLI(
		ctx,
		"cwebp",
		[]string{"-quiet", "-q", "82"},
		".jpg",
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
		[]string{"--min", "28", "--max", "34", "--speed", "6"},
		".jpg",
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

			var rSum, gSum, bSum, aSum, count uint64

			for sy := sy0; sy < sy1; sy++ {
				for sx := sx0; sx < sx1; sx++ {
					cr, cg, cb, ca := src.At(b.Min.X+sx, b.Min.Y+sy).RGBA()

					rSum += uint64(cr >> 8)
					gSum += uint64(cg >> 8)
					bSum += uint64(cb >> 8)
					aSum += uint64(ca >> 8)
					count++
				}
			}

			if count == 0 {
				count = 1
			}

			dst.Set(
				x,
				y,
				color.RGBA{
					R: uint8(rSum / count),
					G: uint8(gSum / count),
					B: uint8(bSum / count),
					A: uint8(aSum / count),
				},
			)
		}
	}

	return dst
}