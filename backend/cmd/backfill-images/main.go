// backfill-images генерирует display-варианты (~3200px) для изображений,
// загруженных до их появления, и проставляет Cache-Control на все существующие
// объекты бакета (server-side copy, без перекачивания данных).
//
// Запуск на VPS (однократно после деплоя):
//
//	docker compose -f docker-compose.prod.yml exec backend /app/backfill-images
//	docker compose -f docker-compose.prod.yml exec backend /app/backfill-images -force
//	docker compose -f docker-compose.prod.yml exec backend /app/backfill-images -dry-run
package main

import (
	"bytes"
	"context"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/jmoiron/sqlx"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"github.com/midfinup1/li.polesh-Store/backend/internal/imageprocessor"
)

const cacheControl = "public, max-age=31536000, immutable"

type imageRow struct {
	ID          int64  `db:"id"`
	ArtworkID   int64  `db:"artwork_id"`
	OriginalURL string `db:"original_url"`
	DisplayURL  string `db:"display_url"`
}

type generatedURLs struct {
	ThumbURL       string
	ThumbWebPURL   string
	ThumbAVIFURL   string
	DisplayURL     string
	DisplayWebPURL string
}

func main() {
	dryRun := flag.Bool("dry-run", false, "print planned actions without writing")
	force := flag.Bool("force", false, "regenerate every thumbnail and display variant")
	skipHeaders := flag.Bool("skip-cache-headers", false, "skip the bucket-wide Cache-Control pass")
	flag.Parse()

	ctx := context.Background()

	databaseURL := mustEnv("DATABASE_URL")
	endpoint := mustEnv("S3_ENDPOINT")
	bucket := mustEnv("S3_BUCKET")
	accessKey := mustEnv("S3_ACCESS_KEY")
	secretKey := mustEnv("S3_SECRET_KEY")
	publicURL := strings.TrimRight(mustEnv("S3_PUBLIC_URL"), "/")
	region := os.Getenv("S3_REGION")

	db, err := sqlx.Open("pgx", databaseURL)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer db.Close()

	s3, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: true,
		Region: region,
	})
	if err != nil {
		log.Fatalf("s3 client: %v", err)
	}

	if err := backfillDisplayVariants(ctx, db, s3, bucket, publicURL, *dryRun, *force); err != nil {
		log.Fatalf("display backfill: %v", err)
	}

	if !*skipHeaders {
		if err := setCacheHeaders(ctx, s3, bucket, *dryRun); err != nil {
			log.Fatalf("cache headers: %v", err)
		}
	}

	log.Println("done")
}

func backfillDisplayVariants(ctx context.Context, db *sqlx.DB, s3 *minio.Client, bucket, publicURL string, dryRun bool, force bool) error {
	var rows []imageRow
	query := `SELECT id, artwork_id, original_url, display_url
		   FROM artwork_images
		  WHERE display_url = ''
		  ORDER BY id`
	if force {
		query = `SELECT id, artwork_id, original_url, display_url
		   FROM artwork_images
		  WHERE original_url <> ''
		  ORDER BY id`
	}

	if err := db.SelectContext(ctx, &rows, query); err != nil {
		return fmt.Errorf("select images: %w", err)
	}

	if force {
		log.Printf("images selected for display regeneration: %d", len(rows))
	} else {
		log.Printf("images without display variant: %d", len(rows))
	}
	processor := imageprocessor.New()
	failed := 0

	for _, row := range rows {
		key := keyFromURL(row.OriginalURL, publicURL)
		if key == "" {
			log.Printf("image %d: cannot derive object key from %q — skipped", row.ID, row.OriginalURL)
			failed++
			continue
		}

		if dryRun {
			log.Printf("[dry-run] image %d: would generate display variants from %s", row.ID, key)
			continue
		}

		obj, err := s3.GetObject(ctx, bucket, key, minio.GetObjectOptions{})
		if err != nil {
			log.Printf("image %d: get %s: %v — skipped", row.ID, key, err)
			failed++
			continue
		}
		data, err := io.ReadAll(obj)
		obj.Close()
		if err != nil {
			log.Printf("image %d: read %s: %v — skipped", row.ID, key, err)
			failed++
			continue
		}

		genCtx, cancel := context.WithTimeout(ctx, 2*time.Minute)
		result, err := processor.Generate(genCtx, data, "")
		cancel()
		if err != nil {
			log.Printf("image %d: process: %v — skipped", row.ID, err)
			failed++
			continue
		}

		urls, err := uploadGeneratedVariants(ctx, s3, bucket, publicURL, row.ArtworkID, row.OriginalURL, result, force)
		if err != nil {
			log.Printf("image %d: upload variants: %v — skipped", row.ID, err)
			failed++
			continue
		}

		if force {
			if _, err := db.ExecContext(ctx,
				`UPDATE artwork_images
				    SET thumb_url = $1,
				        thumb_webp_url = $2,
				        thumb_avif_url = $3,
				        display_url = $4,
				        display_webp_url = $5
				  WHERE id = $6`,
				urls.ThumbURL, urls.ThumbWebPURL, urls.ThumbAVIFURL,
				urls.DisplayURL, urls.DisplayWebPURL, row.ID); err != nil {
				return fmt.Errorf("update image %d: %w", row.ID, err)
			}
		} else if _, err := db.ExecContext(ctx,
			`UPDATE artwork_images SET display_url = $1, display_webp_url = $2 WHERE id = $3`,
			urls.DisplayURL, urls.DisplayWebPURL, row.ID); err != nil {
			return fmt.Errorf("update image %d: %w", row.ID, err)
		}

		if result.ReuseOriginalForDisplay {
			log.Printf("image %d: thumbnails generated; original reused for display", row.ID)
		} else {
			log.Printf("image %d: variants generated (display fallback %d KB)", row.ID, len(result.Display.Data)/1024)
		}
	}

	if failed > 0 {
		return fmt.Errorf("%d of %d images failed", failed, len(rows))
	}

	return nil
}

func uploadGeneratedVariants(
	ctx context.Context,
	s3 *minio.Client,
	bucket string,
	publicURL string,
	artworkID int64,
	originalURL string,
	result *imageprocessor.Result,
	includeThumbnails bool,
) (generatedURLs, error) {
	timestamp := time.Now().UnixNano()
	urls := generatedURLs{}

	if includeThumbnails {
		thumbKey := fmt.Sprintf("artworks/%d/%d_thumb%s", artworkID, timestamp, result.Thumbnail.Extension)
		url, err := putObject(ctx, s3, bucket, publicURL, thumbKey, result.Thumbnail.Data, result.Thumbnail.ContentType)
		if err != nil {
			return generatedURLs{}, fmt.Errorf("upload thumbnail fallback: %w", err)
		}
		urls.ThumbURL = url

		if len(result.ThumbnailWebP) > 0 {
			webpKey := fmt.Sprintf("artworks/%d/%d_thumb.webp", artworkID, timestamp)
			if url, err := putObject(ctx, s3, bucket, publicURL, webpKey, result.ThumbnailWebP, "image/webp"); err == nil {
				urls.ThumbWebPURL = url
			} else {
				log.Printf("artwork %d: upload thumbnail webp: %v", artworkID, err)
			}
		}

		if len(result.ThumbnailAVIF) > 0 {
			avifKey := fmt.Sprintf("artworks/%d/%d_thumb.avif", artworkID, timestamp)
			if url, err := putObject(ctx, s3, bucket, publicURL, avifKey, result.ThumbnailAVIF, "image/avif"); err == nil {
				urls.ThumbAVIFURL = url
			} else {
				log.Printf("artwork %d: upload thumbnail avif: %v", artworkID, err)
			}
		}
	}

	if result.ReuseOriginalForDisplay {
		urls.DisplayURL = originalURL
		if strings.HasSuffix(strings.ToLower(originalURL), ".webp") {
			urls.DisplayWebPURL = originalURL
		}
		return urls, nil
	}

	displayKey := fmt.Sprintf("artworks/%d/%d_display%s", artworkID, timestamp, result.Display.Extension)
	displayURL, err := putObject(ctx, s3, bucket, publicURL, displayKey, result.Display.Data, result.Display.ContentType)
	if err != nil {
		return generatedURLs{}, fmt.Errorf("upload display fallback: %w", err)
	}
	urls.DisplayURL = displayURL

	if len(result.DisplayWebP) > 0 {
		webpKey := fmt.Sprintf("artworks/%d/%d_display.webp", artworkID, timestamp)
		if url, err := putObject(ctx, s3, bucket, publicURL, webpKey, result.DisplayWebP, "image/webp"); err == nil {
			urls.DisplayWebPURL = url
		} else {
			log.Printf("artwork %d: upload display webp: %v", artworkID, err)
		}
	}

	return urls, nil
}

// setCacheHeaders walks every object in the bucket and re-writes its metadata
// in place (server-side copy) so the S3 endpoint starts sending Cache-Control.
// Content-Type is preserved explicitly because the REPLACE directive would
// otherwise drop it.
func setCacheHeaders(ctx context.Context, s3 *minio.Client, bucket string, dryRun bool) error {
	updated, skipped := 0, 0

	for object := range s3.ListObjects(ctx, bucket, minio.ListObjectsOptions{Recursive: true}) {
		if object.Err != nil {
			return fmt.Errorf("list objects: %w", object.Err)
		}

		if !shouldUpdateCacheHeaders(object.Key) {
			skipped++
			continue
		}

		stat, err := s3.StatObject(ctx, bucket, object.Key, minio.StatObjectOptions{})
		if err != nil {
			log.Printf("%s: stat: %v — skipped", object.Key, err)
			skipped++
			continue
		}

		if strings.EqualFold(stat.Metadata.Get("Cache-Control"), cacheControl) {
			skipped++
			continue
		}

		if dryRun {
			log.Printf("[dry-run] %s: would set Cache-Control", object.Key)
			continue
		}

		src := minio.CopySrcOptions{Bucket: bucket, Object: object.Key}
		dst := minio.CopyDestOptions{
			Bucket:          bucket,
			Object:          object.Key,
			ReplaceMetadata: true,
			UserMetadata: map[string]string{
				"Cache-Control": cacheControl,
				"Content-Type":  stat.ContentType,
			},
		}

		if _, err := s3.CopyObject(ctx, dst, src); err != nil {
			log.Printf("%s: copy: %v — skipped", object.Key, err)
			skipped++
			continue
		}
		updated++
	}

	log.Printf("cache headers: updated %d objects, skipped %d", updated, skipped)
	return nil
}

func shouldUpdateCacheHeaders(key string) bool {
	return strings.HasPrefix(key, "artworks/") || strings.HasPrefix(key, "artist/")
}

func putObject(ctx context.Context, s3 *minio.Client, bucket, publicURL, key string, data []byte, contentType string) (string, error) {
	_, err := s3.PutObject(ctx, bucket, key, bytes.NewReader(data), int64(len(data)), minio.PutObjectOptions{
		ContentType:  contentType,
		CacheControl: cacheControl,
	})
	if err != nil {
		return "", err
	}
	return publicURL + "/" + key, nil
}

func keyFromURL(objectURL, publicURL string) string {
	if strings.HasPrefix(objectURL, publicURL+"/") {
		return strings.TrimPrefix(objectURL, publicURL+"/")
	}
	// Fallback: take the path after the bucket segment for URLs built from a
	// different base (e.g. direct s3 endpoint vs CDN domain).
	if idx := strings.Index(objectURL, "/artworks/"); idx != -1 {
		return objectURL[idx+1:]
	}
	if idx := strings.Index(objectURL, "/artist/"); idx != -1 {
		return objectURL[idx+1:]
	}
	return ""
}

func mustEnv(name string) string {
	value := os.Getenv(name)
	if value == "" {
		log.Fatalf("environment variable %s is required", name)
	}
	return value
}
