-- ============================================================
-- PATCH B: Fix TOCTOU in decrease_credits
-- ============================================================
-- PROBLEM: Current version does SELECT then UPDATE separately.
--          Concurrent requests can both pass the SELECT check
--          and both execute UPDATE, resulting in negative balance.
-- FIX:     Single atomic UPDATE with WHERE credits >= amount.
--          No window between check and mutation.
-- ============================================================
-- Drop old function first (parameter name changed from user_id to p_user_id)
DROP FUNCTION IF EXISTS decrease_credits(uuid, int);
CREATE OR REPLACE FUNCTION decrease_credits(p_user_id uuid, p_amount int) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_updated int;
BEGIN -- Single atomic UPDATE with WHERE guard — no TOCTOU window
UPDATE profiles
SET credits = credits - p_amount
WHERE id = p_user_id
    AND credits >= p_amount;
GET DIAGNOSTICS v_updated = ROW_COUNT;
IF v_updated = 0 THEN RAISE EXCEPTION 'Insufficient credits';
END IF;
END;
$$;