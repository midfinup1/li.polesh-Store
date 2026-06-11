// backfill-images генерирует display-варианты (~1600px) для изображений,
// загруженных до их появления, и проставляет Cache-Control на все существующие
// объекты бакета (server-side copy, без перекачивания данных).
//
// Запуск на VPS (однократно после деплоя):
//
//	docker compose -f docker-compose.prod.yml exec backend /app/backfill-images
//	docker compose -f docker-compose.prod.yml exec backend /app/backfill-images -dry-run
package main

import (
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

func main() {
	dryRun := flag.Bool("dry-run", false, "print planned actions without writing")
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

	if err := backfillDisplayVariants(ctx, db, s3, bucket, publicURL, *dryRun); err != nil {
		log.Fatalf("display backfill: %v", err)
	}

	if !*skipHeaders {
		if err := setCacheHeaders(ctx, s3, bucket, *dryRun); err != nil {
			log.Fatalf("cache headers: %v", err)
		}
	}

	log.Println("done")
}

func backfillDisplayVariants(ctx context.Context, db *sqlx.DB, s3 *minio.Client, bucket, publicURL string, dryRun bool) error {
	var rows []imageRow
	if err := db.SelectContext(ctx, &rows,
		`SELECT id, artwork_id, original_url, display_url
		   FROM artwork_images
		  WHERE display_url = ''
		  ORDER BY id`); err != nil {
		return fmt.Errorf("select images: %w", err)
	}

	log.Printf("images without display variant: %d", len(rows))
	processor := imageprocessor.New()

	for _, row := range rows {
		key := keyFromURL(row.OriginalURL, publicURL)
		if key == "" {
			log.Printf("image %d: cannot derive object key from %q — skipped", row.ID, row.OriginalURL)
			continue
		}

		if dryRun {
			log.Printf("[dry-run] image %d: would generate display variants from %s", row.ID, key)
			continue
		}

		obj, err := s3.GetObject(ctx, bucket, key, minio.GetObjectOptions{})
		if err != nil {
			log.Printf("image %d: get %s: %v — skipped", row.ID, key, err)
			continue
		}
		data, err := io.ReadAll(obj)
		obj.Close()
		if err != nil {
			log.Printf("image %d: read %s: %v — skipped", row.ID, key, err)
			continue
		}

		genCtx, cancel := context.WithTimeout(ctx, 2*time.Minute)
		result, err := processor.Generate(genCtx, data, "")
		cancel()
		if err != nil {
			log.Printf("image %d: process: %v — skipped", row.ID, err)
			continue
		}

		timestamp := time.Now().UnixNano()
		displayURL := ""
		displayWebPURL := ""

		jpgKey := fmt.Sprintf("artworks/%d/%d_display.jpg", row.ArtworkID, timestamp)
		if url, err := putObject(ctx, s3, bucket, publicURL, jpgKey, result.DisplayJPEG, "image/jpeg"); err == nil {
			displayURL = url
		} else {
			log.Printf("image %d: upload display jpeg: %v — skipped", row.ID, err)
			continue
		}

		if len(result.DisplayWebP) > 0 {
			webpKey := fmt.Sprintf("artworks/%d/%d_display.webp", row.ArtworkID, timestamp)
			if url, err := putObject(ctx, s3, bucket, publicURL, webpKey, result.DisplayWebP, "image/webp"); err == nil {
				displayWebPURL = url
			}
		}

		if _, err := db.ExecContext(ctx,
			`UPDATE artwork_images SET display_url = $1, display_webp_url = $2 WHERE id = $3`,
			displayURL, displayWebPURL, row.ID); err != nil {
			return fmt.Errorf("update image %d: %w", row.ID, err)
		}

		log.Printf("image %d: display variants generated (%d KB jpeg)", row.ID, len(result.DisplayJPEG)/1024)
	}

	return nil
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

func putObject(ctx context.Context, s3 *minio.Client, bucket, publicURL, key string, data []byte, contentType string) (string, error) {
	_, err := s3.PutObject(ctx, bucket, key, strings.NewReader(string(data)), int64(len(data)), minio.PutObjectOptions{
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
