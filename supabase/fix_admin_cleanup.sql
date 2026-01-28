-- FINAL CLEANUP & FIX
-- Run this in Supabase SQL Editor
-- 1. Clean up potential duplicate functions (Overloading)
DROP FUNCTION IF EXISTS public.admin_update_credits(text, int);
DROP FUNCTION IF EXISTS public.admin_update_credits(text, numeric);
-- 2. Create the robust version
-- Using 'numeric' for amount handles both integers and floats safely.
-- Removing explicit search_path to avoid context issues with auth.uid()
CREATE OR REPLACE FUNCTION public.admin_update_credits(target_email text, amount numeric) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE caller_id uuid;
target_id uuid;
is_admin_check boolean;
BEGIN -- 1. Get Caller ID (Safe access)
caller_id := auth.uid();
IF caller_id IS NULL THEN RAISE EXCEPTION 'ERROR: User is not logged in (auth.uid is null)';
END IF;
-- 2. Check Admin Status (Explicitly in public profiles)
SELECT exists(
        SELECT 1
        FROM public.profiles
        WHERE id = caller_id
            AND is_admin = true
    ) INTO is_admin_check;
IF NOT is_admin_check THEN RAISE EXCEPTION 'ERROR: Access Denied. User % is not an admin.',
caller_id;
END IF;
-- 3. Get Target User ID
SELECT id INTO target_id
FROM public.profiles
WHERE lower(email) = lower(target_email);
IF target_id IS NULL THEN RAISE EXCEPTION 'ERROR: Target user % not found in profiles.',
target_email;
END IF;
-- 4. Perform Update
UPDATE public.profiles
SET credits = credits + amount
WHERE id = target_id;
END;
$$;