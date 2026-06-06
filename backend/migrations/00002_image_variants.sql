-- +goose Up
ALTER TABLE artwork_images
    ADD COLUMN IF NOT EXISTS thumb_webp_url TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS thumb_avif_url TEXT NOT NULL DEFAULT '';

-- +goose Down
ALTER TABLE artwork_images
    DROP COLUMN IF EXISTS thumb_avif_url,
    DROP COLUMN IF EXISTS thumb_webp_url;
