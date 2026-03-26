-- SECURITY MIGRATION: LOCK THE VAULT (Idempotent Version)
-- This script secures the 'credits' column in the 'profiles' table.
-- 1. Create a Trigger Function to check who is updating
CREATE OR REPLACE FUNCTION public.protect_profile_credits() RETURNS TRIGGER AS $$ BEGIN -- Check if 'credits' is being changed
    IF NEW.credits IS DISTINCT
FROM OLD.credits THEN -- Allow only if the user is a service_role (Edge Function / Admin API)
    -- 'service_role' is the role used by Supabase Admin Client
    IF (auth.role() = 'service_role') THEN RETURN NEW;
ELSE RAISE EXCEPTION 'UNAUTHORIZED: You cannot update credits directly. Please use the payment/market system.';
END IF;
END IF;
-- For other columns (bio, avatar, etc.), allow the update to proceed
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 2. Drop existing trigger if exists (to be safe/idempotent)
DROP TRIGGER IF EXISTS protect_credits_trigger ON public.profiles;
-- 3. Apply Trigger to 'profiles' table
CREATE TRIGGER protect_credits_trigger BEFORE
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_credits();
-- 4. Lock down Transactions Table (Insert Only)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- Remove old policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for users" ON public.transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.transactions;
DROP POLICY IF EXISTS "Users see own transactions" ON public.transactions;
DROP POLICY IF EXISTS "System inserts transactions" ON public.transactions;
-- New Strict Policies
-- Users can see their own transactions
CREATE POLICY "Users see own transactions" ON public.transactions FOR
SELECT USING (auth.uid() = user_id);
-- ONLY Service Role can insert transactions (The Ledger is immutable by users)
CREATE POLICY "System inserts transactions" ON public.transactions FOR
INSERT WITH CHECK (auth.role() = 'service_role');
-- 5. Helper for Frontend: Check if Function is ready
COMMENT ON TABLE public.profiles IS 'Protected by protect_credits_trigger';