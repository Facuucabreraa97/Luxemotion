-- ============================================================
-- PATCH A: Fix Whitelist RLS — Admin-Only Updates
-- ============================================================
-- PROBLEM: Current policy allows ANY authenticated user to 
--          update whitelist entries, enabling self-approval.
-- FIX:     Restrict UPDATE to admin users only.
-- ============================================================
-- Remove the dangerous policy
DROP POLICY IF EXISTS "Allow update for authenticated" ON public.whitelist;
-- New policy: Only admins can update whitelist entries
CREATE POLICY "Allow admin update only" ON public.whitelist FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND is_admin = true
        )
    );