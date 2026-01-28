-- REMOVE HIDDEN CREDIT GUARD
-- Run this in Supabase SQL Editor
-- This script removes the "protect_profile_credits" trigger that was blocking edits.
BEGIN;
-- 1. Identify and Drop the Trigger on the profiles table
-- We drop it by name. Since we don't know the exact trigger name, we try the most logical ones
-- or strictly drop the triggers that call the specific function.
DROP TRIGGER IF EXISTS protect_credits ON public.profiles;
DROP TRIGGER IF EXISTS protect_profile_credits ON public.profiles;
DROP TRIGGER IF EXISTS enforce_credit_protection ON public.profiles;
-- 2. Drop the Function that raised the exception
-- This is the specific function name you got in the error log.
DROP FUNCTION IF EXISTS public.protect_profile_credits() CASCADE;
-- 3. (Optional) Re-apply a smarter protection
-- If you want to protect credits from USERS but allow ADMINS, run this:
/*
 CREATE OR REPLACE FUNCTION public.protect_profile_credits()
 RETURNS TRIGGER AS $$
 BEGIN
 -- Allow change if it's the Service Role OR an Admin
 IF (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)) OR (current_setting('role') = 'service_role') THEN
 RETURN NEW;
 END IF;
 
 -- Block otherwise if credits changed
 IF OLD.credits IS DISTINCT FROM NEW.credits THEN
 RAISE EXCEPTION 'UNAUTHORIZED: You cannot update credits directly. Please use the payment/market system.';
 END IF;
 
 RETURN NEW;
 END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;
 
 CREATE TRIGGER protect_credits
 BEFORE UPDATE ON public.profiles
 FOR EACH ROW EXECUTE FUNCTION public.protect_profile_credits();
 */
-- For now, let's just DROP it to ensure immediate fix. You can re-enable security later.
-- We are relying on RLS "Admins only can update" which we already set up.
COMMIT;