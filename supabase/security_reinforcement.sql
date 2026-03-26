-- SECURITY REINFORCEMENT MIGRATION
-- Run this in Supabase SQL Editor
-- 1. Enable RLS on profiles if not already
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- 2. Allow Users to View their Own Profile (and Admin status)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR
SELECT USING (auth.uid() = id);
-- 3. Allow Admins to View All Profiles (for Admin Dashboard)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR
SELECT USING (
        (
            SELECT is_admin
            FROM public.profiles
            WHERE id = auth.uid()
        ) = true
    );
-- 4. RESTRICT UPDATES: Only Admins or Service Role can update is_admin
-- Users can update their own non-sensitive fields (avatar, etc) if needed, 
-- BUT we must protect is_admin.
-- Ideally, separate sensitive columns or use a trigger/function check.
-- For now, we'll use a Policy that allows updates ONLY if the user is Admin
-- OR if they are updating 'safe' fields (complex to do in one policy without helper).
-- SIMPLER: Only Admins can UPDATE authentication/role related fields.
-- We will BLOCK normal users from updating 'is_admin' via a Trigger because RLS is row-based not column-based (mostly).
DROP TRIGGER IF EXISTS check_admin_update ON public.profiles;
DROP FUNCTION IF EXISTS prevent_admin_escalation();
CREATE OR REPLACE FUNCTION prevent_admin_escalation() RETURNS TRIGGER AS $$ BEGIN -- If is_admin is being changed
    IF NEW.is_admin <> OLD.is_admin THEN -- Check if the executor is NOT an admin
    -- Note: auth.uid() might be null for service role, checking context
    IF (auth.uid() IS NOT NULL)
    AND (
        (
            SELECT is_admin
            FROM public.profiles
            WHERE id = auth.uid()
        ) IS NOT TRUE
    ) THEN RAISE EXCEPTION 'Access Denied: You cannot modify admin status.';
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER check_admin_update BEFORE
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION prevent_admin_escalation();
-- 5. Allow Service Role Full Access (Default in Supabase usually, but good to ensure RLS doesn't block it if using local client)
-- Service role bypasses RLS by default.