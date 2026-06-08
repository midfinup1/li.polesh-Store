-- +goose Up

CREATE TABLE IF NOT EXISTS admins (
    id            BIGSERIAL PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artist (
    id              BIGSERIAL PRIMARY KEY,
    name            TEXT NOT NULL DEFAULT '',
    name_en         TEXT NOT NULL DEFAULT '',
    bio             TEXT NOT NULL DEFAULT '',
    bio_en          TEXT NOT NULL DEFAULT '',
    photo_url       TEXT NOT NULL DEFAULT '',
    home_photo_url  TEXT NOT NULL DEFAULT '',
    about_photo_url TEXT NOT NULL DEFAULT '',
    email           TEXT NOT NULL DEFAULT '',
    instagram       TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO artist (
    name,
    name_en,
    bio,
    bio_en,
    photo_url,
    home_photo_url,
    about_photo_url,
    email,
    instagram
)
SELECT
    'Елизавета Полещенко',
    'Elizaveta Poleshchenko',
    'В своей художественной практике я обращаюсь к познанию личного и эмоционального, через анализ мимолетных образов, формируя из интуитивного целостные образы и сюжеты. Через анималистичные образы рассуждаю о внутреннем, о привязанностях, о поиске объяснения своих действий и чувств. Человек в моих работах чаще находится в роли наблюдателя и больше выражает процесс обдумывания нежели процесс прямых и активных действий. В начале своей работы над картиной мне важны первые интуитивные зарисовки и мазки, из которых потом формируется целостный образ.',
    'In my artistic practice, I turn to the exploration of the personal and emotional through the analysis of fleeting images, shaping intuitive impressions into complete images and narratives. Through animalistic imagery, I reflect on the inner world, on attachments, and on the search for explanations for one’s actions and feelings. The human figure in my works is more often placed in the role of an observer and expresses the process of contemplation rather than direct and active action. At the beginning of my work on a painting, the first intuitive sketches and brushstrokes are important to me; from them, a complete image later begins to form.',
    '',
    '',
    '',
    '',
    ''
WHERE NOT EXISTS (
    SELECT 1 FROM artist
);

CREATE TABLE IF NOT EXISTS categories (
    id         BIGSERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    name_en    TEXT NOT NULL DEFAULT '',
    slug       TEXT NOT NULL UNIQUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categories (
    name,
    name_en,
    slug,
    sort_order
)
VALUES
    ('картины', 'paintings', 'paintings', 0),
    ('постеры', 'posters', 'posters', 1),
    ('керамика', 'ceramics', 'ceramics', 2)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS artworks (
    id             BIGSERIAL PRIMARY KEY,
    title          TEXT NOT NULL,
    title_en       TEXT NOT NULL DEFAULT '',
    description    TEXT NOT NULL DEFAULT '',
    description_en TEXT NOT NULL DEFAULT '',
    price          BIGINT NULL,
    status         TEXT NOT NULL DEFAULT 'available',
    category_id    BIGINT NULL REFERENCES categories(id) ON DELETE SET NULL,
    year           INT NULL,
    size           TEXT NOT NULL DEFAULT '',
    size_en        TEXT NOT NULL DEFAULT '',
    materials      TEXT NOT NULL DEFAULT '',
    materials_en   TEXT NOT NULL DEFAULT '',
    sort_order     INT NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT artworks_status_check CHECK (
        status IN ('available', 'sold', 'hidden')
    ),

    CONSTRAINT artworks_price_check CHECK (
        price IS NULL OR price >= 0
    ),

    CONSTRAINT artworks_year_check CHECK (
        year IS NULL OR year BETWEEN 1000 AND 9999
    )
);

CREATE INDEX IF NOT EXISTS idx_artworks_category_id
    ON artworks(category_id);

CREATE INDEX IF NOT EXISTS idx_artworks_status
    ON artworks(status);

CREATE INDEX IF NOT EXISTS idx_artworks_sort_order
    ON artworks(sort_order);

CREATE TABLE IF NOT EXISTS artwork_images (
    id             BIGSERIAL PRIMARY KEY,
    artwork_id     BIGINT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    original_url   TEXT NOT NULL DEFAULT '',
    thumb_url      TEXT NOT NULL DEFAULT '',
    thumb_webp_url TEXT NOT NULL DEFAULT '',
    thumb_avif_url TEXT NOT NULL DEFAULT '',
    alt_text       TEXT NOT NULL DEFAULT '',
    sort_order     INT NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artwork_images_artwork_id
    ON artwork_images(artwork_id);

CREATE INDEX IF NOT EXISTS idx_artwork_images_sort_order
    ON artwork_images(sort_order);

CREATE TABLE IF NOT EXISTS orders (
    id         BIGSERIAL PRIMARY KEY,
    artwork_id BIGINT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT NOT NULL DEFAULT '',
    message    TEXT NOT NULL DEFAULT '',
    status     TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT orders_status_check CHECK (
        status IN ('new', 'contacted', 'completed', 'cancelled')
    )
);

CREATE INDEX IF NOT EXISTS idx_orders_artwork_id
    ON orders(artwork_id);

CREATE INDEX IF NOT EXISTS idx_orders_status
    ON orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_created_at
    ON orders(created_at);

CREATE TABLE IF NOT EXISTS analytics_events (
    id          BIGSERIAL PRIMARY KEY,
    path        TEXT NOT NULL,
    artwork_id  BIGINT NULL REFERENCES artworks(id) ON DELETE SET NULL,
    category_id BIGINT NULL REFERENCES categories(id) ON DELETE SET NULL,
    event_type  TEXT NOT NULL DEFAULT 'page_view',
    user_agent  TEXT NOT NULL DEFAULT '',
    referrer    TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
    ON analytics_events(created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_path
    ON analytics_events(path);

CREATE INDEX IF NOT EXISTS idx_analytics_events_artwork_id
    ON analytics_events(artwork_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_category_id
    ON analytics_events(category_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type
    ON analytics_events(event_type);

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

DROP TRIGGER IF EXISTS trg_admins_updated_at ON admins;
CREATE TRIGGER trg_admins_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_artist_updated_at ON artist;
CREATE TRIGGER trg_artist_updated_at
BEFORE UPDATE ON artist
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_artworks_updated_at ON artworks;
CREATE TRIGGER trg_artworks_updated_at
BEFORE UPDATE ON artworks
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_artwork_images_updated_at ON artwork_images;
CREATE TRIGGER trg_artwork_images_updated_at
BEFORE UPDATE ON artwork_images
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- +goose Down

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS trg_artwork_images_updated_at ON artwork_images;
DROP TRIGGER IF EXISTS trg_artworks_updated_at ON artworks;
DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS trg_artist_updated_at ON artist;
DROP TRIGGER IF EXISTS trg_admins_updated_at ON admins;

DROP FUNCTION IF EXISTS set_updated_at();

DROP TABLE IF EXISTS analytics_events;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS artwork_images;
DROP TABLE IF EXISTS artworks;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS artist;
DROP TABLE IF EXISTS admins;