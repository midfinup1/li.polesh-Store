-- +goose Up

ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS purchase_comment TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS purchase_comment_en TEXT NOT NULL DEFAULT '';

-- +goose Down

ALTER TABLE artworks
DROP COLUMN IF EXISTS purchase_comment,
DROP COLUMN IF EXISTS purchase_comment_en;
