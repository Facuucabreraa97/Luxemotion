-- NUCLEAR OPTION: V2 Function
-- Using a new name forces Supabase to recognize the function freshly, modifying the schema cache instantly.
CREATE OR REPLACE FUNCTION public.admin_update_credits_v2(target_email text, credit_amount numeric) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE target_profile_id uuid;
admin_id uuid;
BEGIN -- 1. LOG INPUT
RAISE LOG 'RPC V2 called. Caller: %, Target: %, Amount: %',
auth.uid(),
target_email,
credit_amount;
-- 2. VERIFY ADMIN
SELECT id INTO admin_id
FROM public.profiles
WHERE id = auth.uid()
    AND is_admin = true;
IF admin_id IS NULL THEN RAISE EXCEPTION 'Access Denied: You are not an admin.';
END IF;
-- 3. FIND TARGET
SELECT id INTO target_profile_id
FROM public.profiles
WHERE email = target_email
LIMIT 1;
-- Fallback to auth.users if not found in profiles explicitly (rare case)
IF target_profile_id IS NULL THEN
SELECT id INTO target_profile_id
FROM auth.users
WHERE email = target_email
LIMIT 1;
END IF;
IF target_profile_id IS NULL THEN RAISE EXCEPTION 'User % not found.',
target_email;
END IF;
-- 4. UPDATE
UPDATE public.profiles
SET credits = COALESCE(credits, 0) + credit_amount
WHERE id = target_profile_id;
RAISE LOG 'Credits parsed and updated successfully.';
END;
$$;