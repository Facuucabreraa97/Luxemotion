-- EMERGENCY FIX v3 (Handling Missing Columns)
-- Run this in Supabase SQL Editor
BEGIN;
-- 1. DROP DEPENDENT VIEW FIRST
DROP VIEW IF EXISTS public.admin_users_view;
-- 2. ALTER COLUMN (Safe cast)
ALTER TABLE public.profiles
ALTER COLUMN credits TYPE numeric USING credits::numeric;
-- 3. Reset RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins Full Access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users Read Own" ON public.profiles;
-- 4. Admin Check Function
CREATE OR REPLACE FUNCTION public.check_is_admin_final() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND is_admin = true
    );
END;
$$;
-- 5. Policies
CREATE POLICY "Admins Full Access" ON public.profiles FOR ALL USING (check_is_admin_final() = true);
CREATE POLICY "Users Read Own" ON public.profiles FOR
SELECT USING (auth.uid() = id);
-- 6. RECREATE THE VIEW (Robust Definition)
-- Mapping to fit AdminUserView interface:
-- user_id, email, whitelist_status, applied_at, last_sign_in_at, credits, avatar_url
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT p.id AS user_id,
    p.email,
    -- Default status to 'approved' if column is missing, or use logic if you prefer
    'approved'::text as whitelist_status,
    -- Map created_at to applied_at
    p.created_at AS applied_at,
    -- Handle missing last_sign_in_at by returning NULL
    NULL::text AS last_sign_in_at,
    p.credits,
    -- Now numeric
    NULL::text as avatar_url
FROM public.profiles p;
-- 7. Grant Permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.admin_users_view TO authenticated;
COMMIT;