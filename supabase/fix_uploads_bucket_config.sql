-- ═══════════════════════════════════════════════════════════════
-- PATCH C (server): Uploads bucket config — MIME + size limits
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════
UPDATE storage.buckets
SET file_size_limit = 10485760,
    -- 10MB max
    allowed_mime_types = ARRAY [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/webm'
    ]
WHERE id = 'uploads';
-- Also apply to videos bucket (only video MIME types)
UPDATE storage.buckets
SET file_size_limit = 104857600,
    -- 100MB max for videos
    allowed_mime_types = ARRAY [
        'video/mp4',
        'video/webm',
        'video/quicktime'
    ]
WHERE id = 'videos';