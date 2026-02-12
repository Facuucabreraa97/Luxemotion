-- ═══════════════════════════════════════════════════════════════
-- FIX: Ghost Assets (403) + Duplicate Drafts
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════
-- 1. Make 'videos' bucket PUBLIC so marketplace previews load
UPDATE storage.buckets
SET public = true
WHERE id = 'videos';
-- 2. Allow anonymous SELECT on videos bucket (public read)
CREATE POLICY IF NOT EXISTS "Public read for videos" ON storage.objects FOR
SELECT TO public USING (bucket_id = 'videos');
-- 3. Prevent duplicate drafts: unique constraint on (user_id, video_url)
-- This is a safety net against double-save race conditions
ALTER TABLE talents
ADD CONSTRAINT unique_user_video UNIQUE (user_id, video_url);