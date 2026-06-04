-- +goose Up
-- +goose StatementBegin

CREATE TABLE artist (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL DEFAULT '',
    bio         TEXT NOT NULL DEFAULT '',
    photo_url   TEXT NOT NULL DEFAULT '',
    email       TEXT NOT NULL DEFAULT '',
    instagram   TEXT NOT NULL DEFAULT '',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial artist row
INSERT INTO artist (name) VALUES ('');

CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    sort_order  INT  NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE artworks (
    id          SERIAL PRIMARY KEY,
    title       TEXT          NOT NULL,
    description TEXT          NOT NULL DEFAULT '',
    price       BIGINT,                               -- NULL = price on request
    status      TEXT          NOT NULL DEFAULT 'available'
                    CHECK (status IN ('available', 'sold', 'hidden')),
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    year        INT,
    size        TEXT NOT NULL DEFAULT '',
    materials   TEXT NOT NULL DEFAULT '',
    sort_order  INT  NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE artwork_images (
    id           SERIAL PRIMARY KEY,
    artwork_id   INT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    original_url TEXT NOT NULL,
    thumb_url    TEXT NOT NULL,
    alt_text     TEXT NOT NULL DEFAULT '',
    sort_order   INT  NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
    id          SERIAL PRIMARY KEY,
    artwork_id  INT NOT NULL REFERENCES artworks(id) ON DELETE RESTRICT,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    phone       TEXT NOT NULL DEFAULT '',
    message     TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'contacted', 'completed', 'cancelled')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admins (
    id            SERIAL PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_artworks_status      ON artworks(status);
CREATE INDEX idx_artworks_category_id ON artworks(category_id);
CREATE INDEX idx_artwork_images_artwork_id ON artwork_images(artwork_id);
CREATE INDEX idx_orders_artwork_id    ON orders(artwork_id);
CREATE INDEX idx_orders_status        ON orders(status);

-- +goose StatementEnd

-- +goose Down
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS artwork_images;
DROP TABLE IF EXISTS artworks;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS artist;
