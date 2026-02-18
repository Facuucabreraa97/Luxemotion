-- ═══════════════════════════════════════════════════════════════
-- PATCH A: Uploads bucket — RLS policies scoped per user
-- Users store files in uploads/{user_id}/... folders
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════
-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false) ON CONFLICT (id) DO
UPDATE
SET public = false;
-- 1. Users can INSERT only into their own folder
DROP POLICY IF EXISTS "Users upload own files" ON storage.objects;
CREATE POLICY "Users upload own files" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'uploads'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
-- 2. Users can SELECT only their own files
DROP POLICY IF EXISTS "Users read own files" ON storage.objects;
CREATE POLICY "Users read own files" ON storage.objects FOR
SELECT TO authenticated USING (
        bucket_id = 'uploads'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
-- 3. Users can DELETE only their own files
DROP POLICY IF EXISTS "Users delete own files" ON storage.objects;
CREATE POLICY "Users delete own files" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name)) [1] = auth.uid()::text
);
-- 4. Users can UPDATE (overwrite) only their own files
DROP POLICY IF EXISTS "Users update own files" ON storage.objects;
CREATE POLICY "Users update own files" ON storage.objects FOR
UPDATE TO authenticated USING (
        bucket_id = 'uploads'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
-- 5. Admins can read ALL uploads (for moderation)
DROP POLICY IF EXISTS "Admins read all uploads" ON storage.objects;
CREATE POLICY "Admins read all uploads" ON storage.objects FOR
SELECT TO authenticated USING (
        bucket_id = 'uploads'
        AND EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND is_admin = true
        )
    );