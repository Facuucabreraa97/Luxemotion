-- FIX: Restore admin_users_view to join whitelist table
-- Run this in Supabase SQL Editor
-- The emergency_fix_v3 broke this view by hardcoding 'approved' status
DROP VIEW IF EXISTS public.admin_users_view;
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT w.email,
    w.status::text AS whitelist_status,
    w.created_at AS applied_at,
    au.id AS user_id,
    au.last_sign_in_at::text,
    COALESCE(p.credits, 0) AS credits,
    p.avatar_url::text
FROM public.whitelist w
    LEFT JOIN auth.users au ON lower(au.email) = lower(w.email)
    LEFT JOIN public.profiles p ON p.id = au.id;
-- Re-grant permissions
GRANT SELECT ON public.admin_users_view TO authenticated;