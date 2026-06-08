-- +goose Up

ALTER TABLE artist
    ADD COLUMN IF NOT EXISTS home_photo_url TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS about_photo_url TEXT NOT NULL DEFAULT '';

UPDATE artist
SET home_photo_url = photo_url
WHERE home_photo_url = ''
  AND photo_url <> '';

UPDATE artist
SET about_photo_url = photo_url
WHERE about_photo_url = ''
  AND photo_url <> '';

UPDATE artwork_images AS image
SET alt_text = artwork.title
FROM artworks AS artwork
WHERE image.artwork_id = artwork.id
  AND (image.alt_text IS NULL OR btrim(image.alt_text) = '');

-- +goose Down

ALTER TABLE artist
    DROP COLUMN IF EXISTS home_photo_url,
    DROP COLUMN IF EXISTS about_photo_url;
