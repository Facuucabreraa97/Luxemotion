-- PAYMENT GATEWAY PRO UPGRADE
-- Run this AFTER payment_gateway_migration.sql
BEGIN;
-- ============================================================
-- 1. ANTI-FRAUD: UNIQUE constraint on tx_hash
--    Prevents duplicate payment proof submissions
-- ============================================================
-- Create unique partial index (only on non-null tx_hash values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_tx_hash_unique ON public.transactions (tx_hash)
WHERE tx_hash IS NOT NULL
    AND tx_hash != '';
COMMENT ON INDEX idx_transactions_tx_hash_unique IS 'Anti-fraud: prevents same transaction hash from being used twice';
-- ============================================================
-- 2. WHATSAPP CONCIERGE: Add support number to config
-- ============================================================
ALTER TABLE public.payment_methods_config
ADD COLUMN IF NOT EXISTS support_whatsapp_number text DEFAULT '';
COMMENT ON COLUMN public.payment_methods_config.support_whatsapp_number IS 'WhatsApp number for payment support (international format, no +)';
-- ============================================================
-- 3. ADMIN BONUS: Updated review_payment with p_override_amount
--    Allows admin to credit a different amount than originally requested
-- ============================================================
CREATE OR REPLACE FUNCTION review_payment(
        p_transaction_id uuid,
        p_decision text,
        -- 'approved' or 'rejected'
        p_override_amount int DEFAULT NULL -- optional: override credit amount
    ) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_admin_id uuid;
v_tx RECORD;
v_final_amount int;
BEGIN v_admin_id := auth.uid();
-- Admin check
IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = v_admin_id
        AND is_admin = true
) THEN RETURN json_build_object('success', false, 'message', 'Access denied');
END IF;
IF p_decision NOT IN ('approved', 'rejected') THEN RETURN json_build_object(
    'success',
    false,
    'message',
    'Invalid decision. Use approved or rejected'
);
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
-- Determine final amount (override or original)
v_final_amount := COALESCE(p_override_amount, v_tx.amount);
-- Update transaction status (and amount if overridden)
UPDATE public.transactions
SET review_status = p_decision,
    reviewed_by = v_admin_id,
    reviewed_at = now(),
    amount = v_final_amount
WHERE id = p_transaction_id;
-- If approved, credit the user with final amount
IF p_decision = 'approved' THEN
UPDATE public.profiles
SET credits = COALESCE(credits, 0) + v_final_amount
WHERE id = v_tx.user_id;
END IF;
RETURN json_build_object(
    'success',
    true,
    'message',
    'Payment ' || p_decision || ' (' || v_final_amount || ' CR)'
);
END;
$$;
COMMIT;