-- +goose Up

ALTER TABLE artworks DROP CONSTRAINT IF EXISTS artworks_status_check;
ALTER TABLE artworks ADD CONSTRAINT artworks_status_check CHECK (
    status IN ('available', 'reserved', 'sold', 'hidden')
);

-- +goose Down

UPDATE artworks SET status = 'available' WHERE status = 'reserved';
ALTER TABLE artworks DROP CONSTRAINT IF EXISTS artworks_status_check;
ALTER TABLE artworks ADD CONSTRAINT artworks_status_check CHECK (
    status IN ('available', 'sold', 'hidden')
);
