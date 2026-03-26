-- DIAGNOSTIC & FIX: Sync Auth ID with Profile ID
-- Run this in Supabase SQL Editor
-- 1. DIAGNOSTIC: Check for ID Mismatch
-- This will show you if the IDs are different.
SELECT au.email as auth_email,
    au.id as auth_id,
    p.email as profile_email,
    p.id as profile_id,
    p.is_admin,
    CASE
        WHEN au.id = p.id THEN 'MATCH'
        ELSE 'MISMATCH - CRITICAL'
    END as status
FROM auth.users au
    JOIN public.profiles p ON lower(au.email) = lower(p.email)
WHERE au.email = 'dmsfak@proton.me';
-- 2. FIX: Update Profile ID to match Auth ID
-- Only runs if there is a mismatch. This ensures the RLS check (auth.uid() = id) works correctly.
DO $$
DECLARE v_auth_id uuid;
v_profile_id uuid;
BEGIN
SELECT id INTO v_auth_id
FROM auth.users
WHERE email = 'dmsfak@proton.me';
SELECT id INTO v_profile_id
FROM public.profiles
WHERE email = 'dmsfak@proton.me';
IF v_auth_id IS NOT NULL
AND v_profile_id IS NOT NULL
AND v_auth_id != v_profile_id THEN RAISE NOTICE 'Mismatch detected. Updating Profile ID...';
-- Update the profile ID to match the authentic Auth ID
-- Note: This might fail if there are other tables referencing profiles.id without ON UPDATE CASCADE.
-- If it fails, those constraints need to be checked.
UPDATE public.profiles
SET id = v_auth_id
WHERE email = 'dmsfak@proton.me';
RAISE NOTICE 'SUCCESS: Profile ID synchronized with Auth ID.';
ELSE RAISE NOTICE 'No fix needed or User not found.';
END IF;
END $$;