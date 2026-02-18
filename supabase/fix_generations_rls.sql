-- ═══════════════════════════════════════════════════════════════
-- PATCH A: Fix generations RLS — restrict SELECT to own rows
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════
-- 1. Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Allow select for authenticated users on generations" ON generations;
DROP POLICY IF EXISTS "Anyone can view public generations" ON generations;
DROP POLICY IF EXISTS "Users can view own generations" ON generations;
-- 2. Users can only SELECT their own generations (protects prompt IP)
CREATE POLICY "Users can view own generations" ON generations FOR
SELECT TO authenticated USING (auth.uid() = user_id);
-- 3. Admins can SELECT all generations (for PromptHistoryTab)
CREATE POLICY "Admins can view all generations" ON generations FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
                AND profiles.is_admin = true
        )
    );
-- Verify RLS is enabled
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;