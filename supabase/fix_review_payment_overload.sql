-- ============================================================
-- 🔥 EMERGENCY FIX: Function Overload Conflict
-- Run this in Supabase SQL Editor IMMEDIATELY
-- ============================================================
-- STEP 1: NUKE all review_payment signatures
-- (Postgres keeps each overload, we must drop each explicitly)
DROP FUNCTION IF EXISTS public.review_payment(uuid, text);
DROP FUNCTION IF EXISTS public.review_payment(uuid, text, int);
DROP FUNCTION IF EXISTS public.review_payment(uuid, text, int, text, text);
DROP FUNCTION IF EXISTS public.review_payment(uuid, text, integer);
DROP FUNCTION IF EXISTS public.review_payment(uuid, text, integer, text, text);
-- STEP 2: CREATE the ONE AND ONLY review_payment
CREATE OR REPLACE FUNCTION public.review_payment(
        p_transaction_id uuid,
        p_decision text,
        p_override_amount int DEFAULT NULL,
        p_plan_tier text DEFAULT NULL,
        p_billing_cycle text DEFAULT NULL
    ) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_admin_id uuid;
v_tx RECORD;
v_final_amount int;
v_plan_tier text;
v_billing_cycle text;
v_existing_end timestamptz;
v_new_end timestamptz;
v_days int;
BEGIN v_admin_id := auth.uid();
-- Admin check
IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = v_admin_id
        AND is_admin = true
) THEN RETURN json_build_object('success', false, 'message', 'Access denied');
END IF;
-- Validate decision
IF p_decision NOT IN ('approved', 'rejected') THEN RETURN json_build_object('success', false, 'message', 'Invalid decision');
END IF;
-- Get transaction
SELECT * INTO v_tx
FROM public.transactions
WHERE id = p_transaction_id;
IF v_tx IS NULL THEN RETURN json_build_object(
    'success',
    false,
    'message',
    'Transaction not found'
);
END IF;
IF v_tx.review_status != 'pending_review' THEN RETURN json_build_object(
    'success',
    false,
    'message',
    'Transaction already reviewed'
);
END IF;
-- Final credit amount (override or original)
v_final_amount := COALESCE(p_override_amount, v_tx.amount);
-- Resolve plan tier: transaction column > parameter > null
v_plan_tier := COALESCE(v_tx.plan_tier, p_plan_tier);
v_billing_cycle := COALESCE(v_tx.billing_cycle, p_billing_cycle, 'monthly');
-- Mark transaction as reviewed
UPDATE public.transactions
SET review_status = p_decision,
    reviewed_by = v_admin_id,
    reviewed_at = now(),
    amount = v_final_amount
WHERE id = p_transaction_id;
-- If APPROVED → credit user + optionally activate subscription
IF p_decision = 'approved' THEN -- Always add credits
UPDATE public.profiles
SET credits = COALESCE(credits, 0) + v_final_amount
WHERE id = v_tx.user_id;
-- If plan purchase → activate subscription with time calculation
IF v_plan_tier IS NOT NULL
AND v_plan_tier != ''
AND v_plan_tier != 'free' THEN v_days := CASE
    WHEN v_billing_cycle = 'yearly' THEN 365
    ELSE 30
END;
-- Get existing period end for stacking
SELECT current_period_end INTO v_existing_end
FROM public.profiles
WHERE id = v_tx.user_id;
-- Stack: if existing time remains, extend from there
IF v_existing_end IS NOT NULL
AND v_existing_end > now() THEN v_new_end := v_existing_end + (v_days || ' days')::interval;
ELSE v_new_end := now() + (v_days || ' days')::interval;
END IF;
UPDATE public.profiles
SET plan_tier = v_plan_tier,
    billing_cycle = v_billing_cycle,
    current_period_end = v_new_end,
    is_active = true
WHERE id = v_tx.user_id;
END IF;
END IF;
RETURN json_build_object(
    'success',
    true,
    'message',
    'Payment ' || p_decision || ' (' || v_final_amount || ' CR' || CASE
        WHEN v_plan_tier IS NOT NULL
        AND v_plan_tier != ''
        AND v_plan_tier != 'free' THEN ' + ' || upper(v_plan_tier) || ' plan'
        ELSE ''
    END || ')'
);
END;
$$;