-- ============================================================
-- FIX: Payment flood protection + anon access restriction
-- Run in Supabase SQL Editor
-- ============================================================
BEGIN;
-- ============================================================
-- F-3: Limit pending payments to 3 per user (anti-flood)
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
v_pending_count int;
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
-- F-3: Anti-flood — max 3 pending payments per user
SELECT COUNT(*) INTO v_pending_count
FROM public.transactions
WHERE user_id = v_user_id
    AND review_status = 'pending_review';
IF v_pending_count >= 3 THEN RETURN json_build_object(
    'success',
    false,
    'message',
    'You already have 3 pending payments. Please wait for review before submitting more.'
);
END IF;
-- Insert pending transaction (NO credits added yet)
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
-- F-5: Revoke anon access to payment_methods_config
-- Only authenticated users should see payment data (alias/CVU/wallets)
-- ============================================================
REVOKE
SELECT ON public.payment_methods_config
FROM anon;
-- Update the RLS policy to only allow authenticated users
DROP POLICY IF EXISTS "Public read payment methods" ON public.payment_methods_config;
CREATE POLICY "Authenticated read payment methods" ON public.payment_methods_config FOR
SELECT USING (auth.uid() IS NOT NULL);
COMMIT;