-- +goose Up
-- Display-size image variants (~1600px) served by the public artwork carousel
-- instead of full originals. Empty string = variant not generated yet (old
-- rows are filled by cmd/backfill-images; the frontend falls back to the
-- original until then).
ALTER TABLE artwork_images ADD COLUMN IF NOT EXISTS display_url      TEXT NOT NULL DEFAULT '';
ALTER TABLE artwork_images ADD COLUMN IF NOT EXISTS display_webp_url TEXT NOT NULL DEFAULT '';

-- +goose Down
ALTER TABLE artwork_images DROP COLUMN IF EXISTS display_webp_url;
ALTER TABLE artwork_images DROP COLUMN IF EXISTS display_url;
