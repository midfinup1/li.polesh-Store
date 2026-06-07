-- +goose Up

ALTER TABLE artist
    ADD COLUMN IF NOT EXISTS name_en TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS bio_en TEXT NOT NULL DEFAULT '';

ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS name_en TEXT NOT NULL DEFAULT '';

ALTER TABLE artworks
    ADD COLUMN IF NOT EXISTS title_en TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS description_en TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS size_en TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS materials_en TEXT NOT NULL DEFAULT '';

INSERT INTO artist (id, name, name_en, bio, bio_en, email, instagram)
VALUES (
    1,
    'Елизавета Полещенко',
    'Elizaveta Poleshchenko',
    'В своей художественной практике я обращаюсь к познанию личного и эмоционального, через анализ мимолетных образов, формируя из интуитивного целостные образы и сюжеты. Через анималистичные образы рассуждаю о внутреннем, о привязанностях, о поиске объяснения своих действий и чувств. Человек в моих работах чаще находится в роли наблюдателя и больше выражает процесс обдумывания нежели процесс прямых и активных действий. В начале своей работы над картиной мне важны первые интуитивные зарисовки и мазки, из которых потом формируется целостный образ.',
    'In her artistic practice, the artist turns to personal and emotional experience through fleeting images, memory and internal states. Animalistic imagery reveals themes of inner tension, attachment, vulnerability and acceptance. The human figure in her work often appears as an observer, expressing reflection rather than direct action.',
    'lis.polesh@gmail.com',
    'li.polesh'
)
ON CONFLICT (id) DO UPDATE
SET
    name = COALESCE(NULLIF(artist.name, ''), EXCLUDED.name),
    name_en = COALESCE(NULLIF(artist.name_en, ''), EXCLUDED.name_en),
    bio = COALESCE(NULLIF(artist.bio, ''), EXCLUDED.bio),
    bio_en = COALESCE(NULLIF(artist.bio_en, ''), EXCLUDED.bio_en),
    email = COALESCE(NULLIF(artist.email, ''), EXCLUDED.email),
    instagram = COALESCE(NULLIF(artist.instagram, ''), EXCLUDED.instagram),
    updated_at = NOW();

SELECT setval(pg_get_serial_sequence('artist', 'id'), GREATEST((SELECT MAX(id) FROM artist), 1));

INSERT INTO categories (name, name_en, slug, sort_order)
VALUES
    ('картины', 'paintings', 'paintings', 0),
    ('постеры', 'posters', 'posters', 1),
    ('керамика', 'ceramics', 'ceramics', 2)
ON CONFLICT (slug) DO UPDATE
SET
    name = EXCLUDED.name,
    name_en = EXCLUDED.name_en,
    sort_order = EXCLUDED.sort_order;

-- +goose Down

DELETE FROM categories WHERE slug IN ('paintings', 'posters', 'ceramics');

ALTER TABLE artworks
    DROP COLUMN IF EXISTS materials_en,
    DROP COLUMN IF EXISTS size_en,
    DROP COLUMN IF EXISTS description_en,
    DROP COLUMN IF EXISTS title_en;

ALTER TABLE categories
    DROP COLUMN IF EXISTS name_en;

ALTER TABLE artist
    DROP COLUMN IF EXISTS bio_en,
    DROP COLUMN IF EXISTS name_en;
