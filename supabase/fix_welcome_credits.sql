-- ============================================================
-- PATCH B: Move Welcome Credits to Waitlist Approval
-- ============================================================
-- PROBLEM: handle_new_user() grants 100 CR on every signup,
--          enabling bot farming of free credits.
-- FIX:     1. Update handle_new_user() to grant 0 CR
--          2. Grant 100 CR when admin approves in whitelist
-- ============================================================
-- Step 1: Update the signup trigger to NOT give free credits
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$ BEGIN
INSERT INTO public.profiles (id, email, credits)
VALUES (new.id, new.email, 0);
-- 0 CR until admin approves
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Step 2: Create function to grant credits on approval
CREATE OR REPLACE FUNCTION public.grant_welcome_credits() RETURNS trigger AS $$ BEGIN -- Only fire when status changes TO 'approved'
    IF NEW.status = 'approved'
    AND (
        OLD.status IS DISTINCT
        FROM 'approved'
    ) THEN
UPDATE public.profiles
SET credits = credits + 100
WHERE email = NEW.email;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Step 3: Attach trigger to whitelist table
DROP TRIGGER IF EXISTS on_whitelist_approval ON public.whitelist;
CREATE TRIGGER on_whitelist_approval
AFTER
UPDATE ON public.whitelist FOR EACH ROW EXECUTE FUNCTION public.grant_welcome_credits();