-- ============================================================
-- FIX: i18n CMS — Grant + Trigger fixes
-- Run in Supabase SQL Editor
-- Fixes: admin can't save/delete translations
-- ============================================================
BEGIN;
-- ============================================================
-- 1. FIX: Grant full CRUD to authenticated (RLS still controls access)
-- ============================================================
GRANT ALL ON public.site_translations TO authenticated;
-- ============================================================
-- 2. FIX: Add explicit INSERT/UPDATE/DELETE policies
--    (FOR ALL with USING only works for SELECT/UPDATE/DELETE;
--     INSERT needs WITH CHECK)
-- ============================================================
DROP POLICY IF EXISTS "Admin manage translations" ON public.site_translations;
-- Admin: full read (also via public read policy)
-- Admin: insert
CREATE POLICY "Admin insert translations" ON public.site_translations FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND is_admin = true
        )
    );
-- Admin: update
CREATE POLICY "Admin update translations" ON public.site_translations FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND is_admin = true
        )
    );
-- Admin: delete
CREATE POLICY "Admin delete translations" ON public.site_translations FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND is_admin = true
    )
);
-- ============================================================
-- 3. FIX: Trigger must also fire on DELETE to bump version
-- ============================================================
DROP TRIGGER IF EXISTS trg_bump_i18n_version ON public.site_translations;
CREATE TRIGGER trg_bump_i18n_version
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON public.site_translations FOR EACH STATEMENT EXECUTE FUNCTION bump_i18n_version();
COMMIT;