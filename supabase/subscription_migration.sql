-- ============================================================
-- SUBSCRIPTION HOTFIX
-- Replaces subscription_migration.sql with a robust solution
-- Run this AFTER payment_gateway_pro_migration.sql
-- ============================================================
BEGIN;
-- ============================================================
-- 1. ADD subscription columns to PROFILES
-- ============================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan_tier text DEFAULT 'free',
    ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly',
    ADD COLUMN IF NOT EXISTS current_period_end timestamptz DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false;
-- ============================================================
-- 2. ADD plan columns to TRANSACTIONS (the real fix)
--    Plan info travels WITH the transaction, not in description
-- ============================================================
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS plan_tier text DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT NULL;
COMMENT ON COLUMN public.transactions.plan_tier IS 'Plan purchased: talent, producer, mogul (null = credit-only purchase)';
COMMENT ON COLUMN public.transactions.billing_cycle IS 'monthly or yearly (null = credit-only purchase)';
-- ============================================================
-- 3. ROBUST submit_manual_payment
--    Stores plan_tier + billing_cycle directly on the transaction
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
INSERT INTO public.transactions (
        user_id,
        amount,
        description,
        type,
        payment_method,
        proof_url,
        tx_hash,
        review_status,
        plan_tier,
        billing_cycle
    )
VALUES (
        v_user_id,
        p_amount,
        p_description,
        'PURCHASE',
        p_payment_method,
        p_proof_url,
        p_tx_hash,
        'pending_review',
        p_plan_tier,
        p_billing_cycle
    );
RETURN json_build_object(
    'success',
    true,
    'message',
    'Payment submitted for review'
);
END;
$$;
-- ============================================================
-- 4. ROBUST review_payment
--    AUTO-READS plan_tier + billing_cycle FROM the transaction
--    Admin no longer needs to pass them — they come from the tx
-- ============================================================
CREATE OR REPLACE FUNCTION review_payment(
        p_transaction_id uuid,
        p_decision text,
        p_override_amount int DEFAULT NULL,
        p_plan_tier text DEFAULT NULL,
        -- optional override (ignored if tx has plan_tier)
        p_billing_cycle text DEFAULT NULL -- optional override (ignored if tx has billing_cycle)
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
IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = v_admin_id
        AND is_admin = true
) THEN RETURN json_build_object('success', false, 'message', 'Access denied');
END IF;
IF p_decision NOT IN ('approved', 'rejected') THEN RETURN json_build_object('success', false, 'message', 'Invalid decision');
END IF;
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
v_final_amount := COALESCE(p_override_amount, v_tx.amount);
-- PRIORITY: read plan_tier from transaction first, then from parameter
v_plan_tier := COALESCE(v_tx.plan_tier, p_plan_tier);
v_billing_cycle := COALESCE(v_tx.billing_cycle, p_billing_cycle, 'monthly');
-- Update transaction status
UPDATE public.transactions
SET review_status = p_decision,
    reviewed_by = v_admin_id,
    reviewed_at = now(),
    amount = v_final_amount
WHERE id = p_transaction_id;
-- If approved → credit + activate subscription
IF p_decision = 'approved' THEN -- Always credit
UPDATE public.profiles
SET credits = COALESCE(credits, 0) + v_final_amount
WHERE id = v_tx.user_id;
-- If this is a plan purchase → activate subscription
IF v_plan_tier IS NOT NULL
AND v_plan_tier != ''
AND v_plan_tier != 'free' THEN v_days := CASE
    WHEN v_billing_cycle = 'yearly' THEN 365
    ELSE 30
END;
SELECT current_period_end INTO v_existing_end
FROM public.profiles
WHERE id = v_tx.user_id;
-- Stack time if existing period hasn't expired
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
COMMIT;
-- ============================================================
-- HOTFIX: Activate a specific user NOW (replace email)
-- Run this separately after the migration above
-- ============================================================
-- UPDATE public.profiles
-- SET plan_tier = 'producer',
--     billing_cycle = 'monthly',
--     is_active = true,
--     current_period_end = now() + interval '30 days'
-- WHERE email = 'USER_EMAIL_HERE';