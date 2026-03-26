-- DEFINITIVE FIX FOR ADMIN CREDITS
-- Drops all variations to avoid signature confusion (Ambiguous Function calls)
-- 1. Drop potentially conflicting signatures
DROP FUNCTION IF EXISTS public.admin_update_credits(text, integer);
DROP FUNCTION IF EXISTS public.admin_update_credits(text, numeric);
DROP FUNCTION IF EXISTS public.admin_update_credits(text, double precision);
-- 2. Create the robust version
-- Uses 'numeric' to handle any number type coming from JS
CREATE OR REPLACE FUNCTION public.admin_update_credits(target_email text, amount numeric) RETURNS void LANGUAGE plpgsql SECURITY DEFINER -- Runs with elevated permissions
SET search_path = public -- Security best practice
    AS $$
DECLARE target_profile_id uuid;
admin_id uuid;
BEGIN -- A. START DEBUGGING LOG (Visible in Database Logs)
RAISE LOG 'RPC admin_update_credits called by % for target % with amount %',
auth.uid(),
target_email,
amount;
-- B. CHECK IF CALLER IS ADMIN
-- using explicit check against profiles table
SELECT id INTO admin_id
FROM public.profiles
WHERE id = auth.uid()
    AND is_admin = true;
IF admin_id IS NULL THEN RAISE EXCEPTION 'Access Denied: User % is not an admin',
auth.uid() USING HINT = 'Check profiles.is_admin column';
END IF;
-- C. FIND TARGET USER
-- We search in profiles directly since we cleaned up the schema.
-- (Assuming email is in profiles. If not, we might need to join auth.users, but profiles should have it)
SELECT id INTO target_profile_id
FROM public.profiles
WHERE email = target_email
LIMIT 1;
IF target_profile_id IS NULL THEN -- Fallback: Try to find in auth.users if profiles.email is empty
SELECT id INTO target_profile_id
FROM auth.users
WHERE email = target_email
LIMIT 1;
END IF;
IF target_profile_id IS NULL THEN RAISE EXCEPTION 'Target user not found: %',
target_email;
END IF;
-- D. PERFORM UPDATE
UPDATE public.profiles
SET credits = COALESCE(credits, 0) + amount
WHERE id = target_profile_id;
-- E. CONFIRMATION log
RAISE LOG 'Successfully updated credits for %',
target_email;
END;
$$;