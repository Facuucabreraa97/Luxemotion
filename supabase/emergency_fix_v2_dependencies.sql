-- EMERGENCY FIX v2 (Handling Dependencies)
-- Run this in Supabase SQL Editor
BEGIN;
-- 1. DROP DEPENDENT VIEW FIRST (Crucial Step)
DROP VIEW IF EXISTS public.admin_users_view;
-- 2. NOW we can alter the column safely
ALTER TABLE public.profiles
ALTER COLUMN credits TYPE numeric USING credits::numeric;
-- 3. Reset RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins Full Access" ON public.profiles;
-- 4. Create robust admin check
CREATE OR REPLACE FUNCTION public.check_is_admin_final() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND is_admin = true
    );
END;
$$;
-- 5. Create "God Mode" Policies
CREATE POLICY "Admins Full Access" ON public.profiles FOR ALL USING (check_is_admin_final() = true);
CREATE POLICY "Users Read Own" ON public.profiles FOR
SELECT USING (auth.uid() = id);
-- 6. RECREATE THE VIEW (Standard Definition)
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT p.id AS user_id,
    p.email,
    p.credits,
    -- Now numeric
    p.created_at AS joined_at,
    p.last_sign_in_at,
    -- Add other columns as needed based on your schema
    COALESCE(p.plan, 'free') as plan
FROM public.profiles p;
-- 7. Grant Permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.admin_users_view TO authenticated;
COMMIT;