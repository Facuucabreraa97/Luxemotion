-- SUBSCRIPTION TIME MANAGEMENT MIGRATION
-- Run this AFTER payment_gateway_pro_migration.sql
BEGIN;
-- ============================================================
-- 1. ADD subscription columns to profiles
-- ============================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan_tier text DEFAULT 'free',
    ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly',
    ADD COLUMN IF NOT EXISTS current_period_end timestamptz DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false;
COMMENT ON COLUMN public.profiles.plan_tier IS 'free, talent, producer, mogul';
COMMENT ON COLUMN public.profiles.billing_cycle IS 'monthly or yearly';
COMMENT ON COLUMN public.profiles.current_period_end IS 'When current billing period expires';
COMMENT ON COLUMN public.profiles.is_active IS 'Whether user has an active paid subscription';
-- ============================================================
-- 2. UPDATE review_payment to handle plan subscriptions
--    Accepts p_plan_tier + p_billing_cycle for plan purchases
--    Extends current_period_end on approval
-- ============================================================
CREATE OR REPLACE FUNCTION review_payment(
        p_transaction_id uuid,
        p_decision text,
        -- 'approved' or 'rejected'
        p_override_amount int DEFAULT NULL,
        -- optional: override credit amount
        p_plan_tier text DEFAULT NULL,
        -- optional: 'talent','producer','mogul'
        p_billing_cycle text DEFAULT NULL -- optional: 'monthly','yearly'
    ) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_admin_id uuid;
v_tx RECORD;
v_final_amount int;
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
-- Determine final amount
v_final_amount := COALESCE(p_override_amount, v_tx.amount);
-- Update transaction status
UPDATE public.transactions
SET review_status = p_decision,
    reviewed_by = v_admin_id,
    reviewed_at = now(),
    amount = v_final_amount
WHERE id = p_transaction_id;
-- If approved, credit the user
IF p_decision = 'approved' THEN
UPDATE public.profiles
SET credits = COALESCE(credits, 0) + v_final_amount
WHERE id = v_tx.user_id;
-- If plan info provided, activate subscription
IF p_plan_tier IS NOT NULL
AND p_plan_tier != '' THEN -- Calculate days
v_days := CASE
    WHEN COALESCE(p_billing_cycle, 'monthly') = 'yearly' THEN 365
    ELSE 30
END;
-- Get existing period end (for extension)
SELECT current_period_end INTO v_existing_end
FROM public.profiles
WHERE id = v_tx.user_id;
-- If existing end is in the future, extend from that date; otherwise from NOW
IF v_existing_end IS NOT NULL
AND v_existing_end > now() THEN v_new_end := v_existing_end + (v_days || ' days')::interval;
ELSE v_new_end := now() + (v_days || ' days')::interval;
END IF;
UPDATE public.profiles
SET plan_tier = p_plan_tier,
    billing_cycle = COALESCE(p_billing_cycle, 'monthly'),
    current_period_end = v_new_end,
    is_active = true
WHERE id = v_tx.user_id;
END IF;
END IF;
RETURN json_build_object(
    'success',
    true,
    'message',
    'Payment ' || p_decision || ' (' || v_final_amount || ' CR)'
);
END;
$$;
-- ============================================================
-- 3. UPDATE submit_manual_payment to accept plan_tier + billing_cycle
-- ============================================================
CREATE OR REPLACE FUNCTION submit_manual_payment(
        p_amount int,
        p_payment_method text,
        p_proof_url text DEFAULT NULL,
        p_tx_hash text DEFAULT NULL,
        p_description text DEFAULT 'Credit Purchase',
        p_plan_tier text DEFAULT NULL,
        p_billing_cycle text DEFAULT NULL
    ) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_id uuid;
BEGIN v_user_id := auth.uid();
IF v_user_id IS NULL THEN RETURN json_build_object('success', false, 'message', 'Not authenticated');
END IF;
IF p_amount <= 0 THEN RETURN json_build_object(
    'success',
    false,
    'message',
    'Amount must be positive'
);
END IF;
-- Insert pending transaction with plan info in description
INSERT INTO public.transactions (
        user_id,
        amount,
        description,
        type,
        payment_method,
        proof_url,
        tx_hash,
        review_status
    )
VALUES (
        v_user_id,
        p_amount,
        CASE
            WHEN p_plan_tier IS NOT NULL THEN p_description || ' [PLAN:' || p_plan_tier || ':' || COALESCE(p_billing_cycle, 'monthly') || ']'
            ELSE p_description
        END,
        'PURCHASE',
        p_payment_method,
        p_proof_url,
        p_tx_hash,
        'pending_review'
    );
RETURN json_build_object(
    'success',
    true,
    'message',
    'Payment submitted for review'
);
END;
$$;
COMMIT;