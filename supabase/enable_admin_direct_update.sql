-- ENABLE DIRECT ADMIN UPDATES (No RPC needed)
-- 1. Create a policy allowing Admins to UPDATE any profile
-- This relies on the 'check_is_admin()' function we created earlier.
-- If that function doesn't exist, we re-create it here just in case.
CREATE OR REPLACE FUNCTION public.check_is_admin() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND is_admin = true
    );
END;
$$;
-- 2. Drop any existing restrictive update policies to be clean
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
-- 3. Create the Policy
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR
UPDATE USING (check_is_admin() = true);
-- 4. Enable Update for Users on their own profile (optional, but good for completeness, restricted columns ideally but RLS is row-level)
-- We'll keep it simple: Admins can update everyone. Users can't update anything via API (only backend triggers).
-- 5. Grant permissions if missing (Unlikely but safe)
GRANT UPDATE ON public.profiles TO authenticated;