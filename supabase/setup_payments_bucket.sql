-- SUPABASE STORAGE: Payments Bucket Setup
-- Run this in Supabase SQL Editor
-- This creates the 'payments' bucket and sets public read policy
-- 1. Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payments', 'payments', true) ON CONFLICT (id) DO
UPDATE
SET public = true;
-- 2. Allow public READ (so QR images and payment proofs are viewable)
DROP POLICY IF EXISTS "Public read payments" ON storage.objects;
CREATE POLICY "Public read payments" ON storage.objects FOR
SELECT USING (bucket_id = 'payments');
-- 3. Allow authenticated users to UPLOAD to payment-proofs/
DROP POLICY IF EXISTS "Users upload payment proofs" ON storage.objects;
CREATE POLICY "Users upload payment proofs" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'payments'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name)) [1] = 'payment-proofs'
    );
-- 4. Allow admins to UPLOAD QR codes to qr-codes/
DROP POLICY IF EXISTS "Admin upload QR codes" ON storage.objects;
CREATE POLICY "Admin upload QR codes" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'payments'
        AND EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND is_admin = true
        )
        AND (storage.foldername(name)) [1] = 'qr-codes'
    );
-- 5. Allow admins to UPDATE/overwrite QR codes
DROP POLICY IF EXISTS "Admin update QR codes" ON storage.objects;
CREATE POLICY "Admin update QR codes" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'payments'
        AND EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND is_admin = true
        )
        AND (storage.foldername(name)) [1] = 'qr-codes'
    );