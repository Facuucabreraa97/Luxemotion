-- ============================================================
-- PATCH A: Hard CHECK constraint on profiles.credits
-- ============================================================
-- PROBLEM: No physical DB constraint prevents credits from
--          going negative. Software checks in RPCs can be
--          bypassed by direct queries or TOCTOU races.
-- FIX:     Add CHECK (credits >= 0) as last line of defense.
-- ============================================================
ALTER TABLE public.profiles
ADD CONSTRAINT credits_non_negative CHECK (credits >= 0);