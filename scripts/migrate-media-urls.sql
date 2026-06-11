-- Replace direct S3 public URLs with the /media proxy on lipolesh.art.
-- Run after adding the Caddy /media/* proxy and changing S3_PUBLIC_URL.
-- The replace() calls are idempotent: rows already migrated are not changed.

BEGIN;

UPDATE artwork_images SET
  original_url     = replace(original_url,     'https://s3.twcstorage.ru/332f0fae-cd27-4aa5-b0b7-e21c7ebf02a5', 'https://lipolesh.art/media'),
  thumb_url        = replace(thumb_url,        'https://s3.twcstorage.ru/332f0fae-cd27-4aa5-b0b7-e21c7ebf02a5', 'https://lipolesh.art/media'),
  thumb_webp_url   = replace(thumb_webp_url,   'https://s3.twcstorage.ru/332f0fae-cd27-4aa5-b0b7-e21c7ebf02a5', 'https://lipolesh.art/media'),
  thumb_avif_url   = replace(thumb_avif_url,   'https://s3.twcstorage.ru/332f0fae-cd27-4aa5-b0b7-e21c7ebf02a5', 'https://lipolesh.art/media'),
  display_url      = replace(display_url,      'https://s3.twcstorage.ru/332f0fae-cd27-4aa5-b0b7-e21c7ebf02a5', 'https://lipolesh.art/media'),
  display_webp_url = replace(display_webp_url, 'https://s3.twcstorage.ru/332f0fae-cd27-4aa5-b0b7-e21c7ebf02a5', 'https://lipolesh.art/media');

UPDATE artist SET
  photo_url      = replace(photo_url,      'https://s3.twcstorage.ru/332f0fae-cd27-4aa5-b0b7-e21c7ebf02a5', 'https://lipolesh.art/media'),
  home_photo_url = replace(home_photo_url, 'https://s3.twcstorage.ru/332f0fae-cd27-4aa5-b0b7-e21c7ebf02a5', 'https://lipolesh.art/media');

COMMIT;
