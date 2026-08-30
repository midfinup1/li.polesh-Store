-- +goose Up

CREATE TABLE IF NOT EXISTS exhibitions (
    id         BIGSERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    name_en    TEXT NOT NULL DEFAULT '',
    slug       TEXT NOT NULL UNIQUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE artworks
    ADD COLUMN IF NOT EXISTS exhibition_id BIGINT NULL REFERENCES exhibitions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_artworks_exhibition_id
    ON artworks(exhibition_id);

DROP TRIGGER IF EXISTS trg_exhibitions_updated_at ON exhibitions;
CREATE TRIGGER trg_exhibitions_updated_at
BEFORE UPDATE ON exhibitions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- +goose Down

DROP TRIGGER IF EXISTS trg_exhibitions_updated_at ON exhibitions;

DROP INDEX IF EXISTS idx_artworks_exhibition_id;

ALTER TABLE artworks
    DROP COLUMN IF EXISTS exhibition_id;

DROP TABLE IF EXISTS exhibitions;
