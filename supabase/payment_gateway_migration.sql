-- PAYMENT GATEWAY MIGRATION
-- Run this in Supabase SQL Editor
-- Extends existing transactions table + creates payment config table
BEGIN;
-- ============================================================
-- 1. ALTER TABLE: Extend transactions for manual payments
-- ============================================================
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payment_method text,
    ADD COLUMN IF NOT EXISTS proof_url text,
    ADD COLUMN IF NOT EXISTS tx_hash text,
    ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'auto',
    ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
COMMENT ON COLUMN public.transactions.payment_method IS 'mercadopago, crypto_trc20, crypto_erc20, admin_manual, system';
COMMENT ON COLUMN public.transactions.proof_url IS 'URL to uploaded payment receipt/screenshot';
COMMENT ON COLUMN public.transactions.tx_hash IS 'Blockchain transaction hash (crypto payments only)';
COMMENT ON COLUMN public.transactions.review_status IS 'auto (system), pending_review, approved, rejected';
-- ============================================================
-- 2. CREATE TABLE: Payment methods config (admin-editable)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_methods_config (
    id text PRIMARY KEY,
    label text NOT NULL,
    enabled boolean DEFAULT true,
    data jsonb NOT NULL DEFAULT '{}',
    display_order int DEFAULT 0,
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.payment_methods_config ENABLE ROW LEVEL SECURITY;
-- Everyone can READ payment methods (users need to see QR/alias)
DROP POLICY IF EXISTS "Public read payment methods" ON public.payment_methods_config;
CREATE POLICY "Public read payment methods" ON public.payment_methods_config FOR
SELECT USING (true);
-- Only admins can INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Admin manage payment methods" ON public.payment_methods_config;
CREATE POLICY "Admin manage payment methods" ON public.payment_methods_config FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND is_admin = true
    )
);
GRANT SELECT ON public.payment_methods_config TO anon;
GRANT ALL ON public.payment_methods_config TO authenticated;
-- ============================================================
-- 3. SEED: Default payment methods
-- ============================================================
INSERT INTO public.payment_methods_config (id, label, enabled, data, display_order)
VALUES (
        'mercadopago',
        'MercadoPago',
        true,
        '{
    "alias": "",
    "cvu": "",
    "qr_url": "",
    "instructions": "Transferí el monto exacto y subí el comprobante"
  }'::jsonb,
        1
    ),
    (
        'crypto_usdt_trc20',
        'USDT (TRC-20)',
        true,
        '{
    "wallet_address": "",
    "network": "TRC-20",
    "qr_url": "",
    "instructions": "Enviá USDT por la red Tron (TRC-20) y pegá el TX hash"
  }'::jsonb,
        2
    ) ON CONFLICT (id) DO NOTHING;
-- ============================================================
-- 4. RPC: User submits manual payment
-- ============================================================
CREATE OR REPLACE FUNCTION submit_manual_payment(
        p_amount int,
        p_payment_method text,
        p_proof_url text DEFAULT NULL,
        p_tx_hash text DEFAULT NULL,
        p_description text DEFAULT 'Credit Purchase'
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
-- Insert pending transaction (NO credits added yet)
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
        p_description,
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
-- ============================================================
-- 5. RPC: Admin reviews payment (approve/reject)
-- ============================================================
CREATE OR REPLACE FUNCTION review_payment(
        p_transaction_id uuid,
        p_decision text -- 'approved' or 'rejected'
    ) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_admin_id uuid;
v_tx RECORD;
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
-- Update transaction status
UPDATE public.transactions
SET review_status = p_decision,
    reviewed_by = v_admin_id,
    reviewed_at = now()
WHERE id = p_transaction_id;
-- If approved, credit the user
IF p_decision = 'approved' THEN
UPDATE public.profiles
SET credits = COALESCE(credits, 0) + v_tx.amount
WHERE id = v_tx.user_id;
END IF;
RETURN json_build_object(
    'success',
    true,
    'message',
    'Payment ' || p_decision
);
END;
$$;
-- ============================================================
-- 6. Policy: Allow authenticated users to INSERT transactions
--    (for submit_manual_payment to work via RPC)
-- ============================================================
DROP POLICY IF EXISTS "Users insert own pending tx" ON public.transactions;
CREATE POLICY "Users insert own pending tx" ON public.transactions FOR
INSERT WITH CHECK (
        auth.uid() = user_id
        AND review_status = 'pending_review'
    );
COMMIT;