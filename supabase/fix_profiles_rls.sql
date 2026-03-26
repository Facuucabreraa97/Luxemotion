-- FIX PROFILES RLS (Infinite Recursion Issue)
-- Run this in Supabase SQL Editor
-- 1. Create a Helper Function to check Admin Status safely
-- This function is SECURITY DEFINER, meaning it runs with the privileges of the creator (postgres),
-- thus bypassing RLS on the table it queries. This prevents the infinite loop.
CREATE OR REPLACE FUNCTION public.check_is_admin() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public -- Secure search path
    AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND is_admin = true
    );
END;
$$;
-- 2. Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
-- 3. Re-create "Users can view own profile" (Standard)
CREATE POLICY "Users can view own profile" ON public.profiles FOR
SELECT USING (auth.uid() = id);
-- 4. Re-create "Admins can view all profiles" using the Safe Function
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR
SELECT USING (check_is_admin() = true);
-- 5. Ensure Update Policy also uses safe check (if applicable, though Trigger handles updates mostly)
-- Re-applying the TRIGGER just in case, but the previous script handled it. 
-- The main fix here is the SELECT policies.