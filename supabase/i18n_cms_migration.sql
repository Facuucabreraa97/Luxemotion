-- ============================================================
-- DYNAMIC i18n CMS — Migration
-- Run in Supabase SQL Editor
-- Creates site_translations + i18n_version + RLS + auto-trigger
-- ============================================================
BEGIN;
-- ============================================================
-- 1. Translation strings table (flat key → EN/ES values)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_translations (
    translation_key text PRIMARY KEY,
    value_en text NOT NULL DEFAULT '',
    value_es text NOT NULL DEFAULT '',
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.site_translations ENABLE ROW LEVEL SECURITY;
-- Everyone can READ (needed for SWR fetch)
DROP POLICY IF EXISTS "Public read translations" ON public.site_translations;
CREATE POLICY "Public read translations" ON public.site_translations FOR
SELECT USING (true);
-- Only admins can modify
DROP POLICY IF EXISTS "Admin manage translations" ON public.site_translations;
CREATE POLICY "Admin manage translations" ON public.site_translations FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND is_admin = true
    )
);
GRANT SELECT ON public.site_translations TO authenticated;
-- ============================================================
-- 2. Cache version control (single-row table)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.i18n_version (
    id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    -- singleton
    version bigint NOT NULL DEFAULT 1,
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.i18n_version ENABLE ROW LEVEL SECURITY;
-- Everyone can READ the version number
DROP POLICY IF EXISTS "Public read i18n version" ON public.i18n_version;
CREATE POLICY "Public read i18n version" ON public.i18n_version FOR
SELECT USING (true);
-- Only admins can bump the version
DROP POLICY IF EXISTS "Admin update i18n version" ON public.i18n_version;
CREATE POLICY "Admin update i18n version" ON public.i18n_version FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND is_admin = true
        )
    );
GRANT SELECT ON public.i18n_version TO authenticated;
GRANT UPDATE ON public.i18n_version TO authenticated;
-- Initialize singleton row
INSERT INTO public.i18n_version (id, version)
VALUES (1, 1) ON CONFLICT (id) DO NOTHING;
-- ============================================================
-- 3. Trigger: auto-bump version on any translation change
-- ============================================================
CREATE OR REPLACE FUNCTION bump_i18n_version() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
UPDATE public.i18n_version
SET version = version + 1,
    updated_at = now()
WHERE id = 1;
RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_bump_i18n_version ON public.site_translations;
CREATE TRIGGER trg_bump_i18n_version
AFTER
INSERT
    OR
UPDATE ON public.site_translations FOR EACH STATEMENT EXECUTE FUNCTION bump_i18n_version();
-- ============================================================
-- 4. Seed: Existing static keys from en.ts / es.ts
-- ============================================================
INSERT INTO public.site_translations (translation_key, value_en, value_es)
VALUES -- sidebar
    (
        'sidebar.studio',
        'Studio',
        'Estudio'
    ),
    (
        'sidebar.gallery',
        'Gallery',
        'Galería'
    ),
    (
        'sidebar.marketplace',
        'Marketplace',
        'Mercado'
    ),
    (
        'sidebar.billing',
        'Billing',
        'Facturación'
    ),
    (
        'sidebar.signOut',
        'Sign Out',
        'Cerrar Sesión'
    ),
    -- checkout
    (
        'checkout.title',
        'Buy Credits',
        'Comprar Créditos'
    ),
    (
        'checkout.selectMethod',
        'Select a payment method:',
        'Seleccioná un método de pago:'
    ),
    (
        'checkout.youllReceive',
        'You''ll receive',
        'Vas a recibir'
    ),
    (
        'checkout.price',
        'Price',
        'Precio'
    ),
    (
        'checkout.imadePay',
        'I''ve made the payment →',
        'Ya hice el pago →'
    ),
    (
        'checkout.txHash',
        'Transaction Hash',
        'Hash de Transacción'
    ),
    (
        'checkout.uploadReceipt',
        'Click to upload receipt',
        'Hacé clic para subir comprobante'
    ),
    (
        'checkout.uploadHint',
        'PNG, JPG up to 5MB',
        'PNG, JPG hasta 5MB'
    ),
    (
        'checkout.submit',
        'Submit Payment',
        'Enviar Pago'
    ),
    (
        'checkout.submitting',
        'Submitting...',
        'Enviando...'
    ),
    (
        'checkout.successTitle',
        'Payment Submitted!',
        '¡Pago Enviado!'
    ),
    (
        'checkout.successMsg',
        'Your payment is being reviewed by our team.\nCredits will be added once approved.',
        'Tu pago está siendo revisado por nuestro equipo.\nLos créditos se agregarán una vez aprobado.'
    ),
    (
        'checkout.close',
        'Close',
        'Cerrar'
    ),
    (
        'checkout.proofRequired',
        'Please upload a proof of payment',
        'Subí un comprobante de pago'
    ),
    (
        'checkout.txRequired',
        'Please enter the transaction hash',
        'Ingresá el hash de transacción'
    ),
    -- plans
    (
        'plans.title',
        'MEMBERSHIP',
        'MEMBRESÍA'
    ),
    (
        'plans.subtitle',
        'Invest in your assets. Monetize your imagination.',
        'Invertí en tus activos. Monetizá tu imaginación.'
    ),
    (
        'plans.monthly',
        'Monthly',
        'Mensual'
    ),
    (
        'plans.yearly',
        'Yearly',
        'Anual'
    ),
    (
        'plans.monthlyAllowance',
        'Monthly Allowance',
        'Créditos Mensuales'
    ),
    (
        'plans.select',
        'Select',
        'Elegir'
    ),
    (
        'plans.mostPopular',
        'Most Popular',
        'Más Popular'
    ),
    (
        'plans.billedYearly',
        'Billed {price} yearly',
        'Facturado {price} anualmente'
    ),
    -- common
    (
        'common.loading',
        'Loading...',
        'Cargando...'
    ),
    (
        'common.copy',
        'Copy',
        'Copiar'
    ),
    (
        'common.copied',
        'Copied!',
        '¡Copiado!'
    ),
    -- language
    (
        'language.switchLabel',
        'ES / EN',
        'ES / EN'
    ) ON CONFLICT (translation_key) DO NOTHING;
COMMIT;