-- EMERGENCY FIX FOR PROFILES TABLE
-- Run this in Supabase SQL Editor to resolve persistent 400 errors.
BEGIN;
-- 1. Ensure 'credits' is numeric/integer compatible
-- This prevents type mismatches (e.g. float vs int)
ALTER TABLE public.profiles
ALTER COLUMN credits TYPE numeric USING credits::numeric;
-- 2. Drop potential rogue triggers that might be failing silently
DROP TRIGGER IF EXISTS on_profiles_update ON public.profiles;
-- (We assume 'handle_updated_at' is standard and fine, but if you have custom ones, they might be the cause)
-- 3. Reset RLS Policies Completely
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Drop all existing variations to clear conflicts
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins All Access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
-- 4. Create a Robust Admin Check Function (Unique Name)
CREATE OR REPLACE FUNCTION public.check_is_admin_final() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND is_admin = true
    );
END;
$$;
-- 5. Create Simplified Policies ("God Mode" access for Admins)
CREATE POLICY "Admins Full Access" ON public.profiles FOR ALL USING (check_is_admin_final() = true);
CREATE POLICY "Users Read Own" ON public.profiles FOR
SELECT USING (auth.uid() = id);
-- 6. Grant Permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
COMMIT;
-- DEBUG INFO (Will show in Results)
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
    AND column_name = 'credits';