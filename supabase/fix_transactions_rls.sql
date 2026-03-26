-- ============================================================
-- FIX: Transactions RLS — scope SELECT to owner or admin
-- Prevents non-admin users from reading other users' transactions
-- ============================================================
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- Drop any existing overly permissive SELECT policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
-- Users see only their own transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR
SELECT USING (auth.uid() = user_id);
-- Admins see all transactions (needed for PaymentApprovalsTab)
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND is_admin = true
        )
    );
-- NOTE: The INSERT policy from payment_gateway_migration.sql is preserved:
-- "Users insert own pending tx" → auth.uid() = user_id AND review_status = 'pending_review'