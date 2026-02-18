-- ============================================================
-- FIX: Atomic credit adjustment RPC for admin
-- Replaces the TOCTOU read-then-write pattern in admin.service.ts
-- ============================================================
CREATE OR REPLACE FUNCTION admin_adjust_credits(target_user_id uuid, delta int) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN -- Admin check
    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND is_admin = true
    ) THEN RAISE EXCEPTION 'Access denied: admin only';
END IF;
-- Atomic update: credits = credits + delta, floor at 0
UPDATE public.profiles
SET credits = GREATEST(COALESCE(credits, 0) + delta, 0)
WHERE id = target_user_id;
IF NOT FOUND THEN RAISE EXCEPTION 'User not found';
END IF;
END;
$$;