-- ============================================================
-- FIX: Payments storage — scope reads by folder + add DELETE
-- QR codes: public read (users need to see them)
-- Payment proofs: only admins can read (proof URL stored in tx)
-- ============================================================
-- 1. DROP the overly permissive global read
DROP POLICY IF EXISTS "Public read payments" ON storage.objects;
-- 2. QR codes are PUBLIC (users need to see them for payment)
DROP POLICY IF EXISTS "Public read QR codes" ON storage.objects;
CREATE POLICY "Public read QR codes" ON storage.objects FOR
SELECT USING (
        bucket_id = 'payments'
        AND (storage.foldername(name)) [1] = 'qr-codes'
    );
-- 3. Payment proofs: only admins can read them directly
--    (Normal users access their proof via the URL stored in their transaction)
DROP POLICY IF EXISTS "Admins read all payment proofs" ON storage.objects;
CREATE POLICY "Admins read all payment proofs" ON storage.objects FOR
SELECT USING (
        bucket_id = 'payments'
        AND (storage.foldername(name)) [1] = 'payment-proofs'
        AND EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND is_admin = true
        )
    );
-- 4. Admins can DELETE QR codes (cleanup obsolete ones)
DROP POLICY IF EXISTS "Admin delete QR codes" ON storage.objects;
CREATE POLICY "Admin delete QR codes" ON storage.objects FOR DELETE USING (
    bucket_id = 'payments'
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND is_admin = true
    )
    AND (storage.foldername(name)) [1] = 'qr-codes'
);
-- 5. Admins can DELETE payment proofs (cleanup)
DROP POLICY IF EXISTS "Admin delete payment proofs" ON storage.objects;
CREATE POLICY "Admin delete payment proofs" ON storage.objects FOR DELETE USING (
    bucket_id = 'payments'
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND is_admin = true
    )
    AND (storage.foldername(name)) [1] = 'payment-proofs'
);