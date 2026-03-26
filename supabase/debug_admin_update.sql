-- DEBUG & FIX ADMIN FUNCTION
-- Run this in Supabase SQL Editor
-- Overwriting the function with explicit Search Path and detailed Error Messages
-- to diagnose why it fails (400 Bad Request usually means a RAISE EXCEPTION was triggered).
create or replace function admin_update_credits(target_email text, amount int) returns void language plpgsql security definer
SET search_path = public,
    auth,
    extensions -- Explicitly allow access to these schemas
    as $$
declare target_id uuid;
caller_id uuid;
is_admin_check boolean;
begin -- 1. Identify Caller
caller_id := auth.uid();
if caller_id is null then raise exception 'DEBUG_ERROR: No Auth Session (auth.uid is null). Are you logged in?';
end if;
-- 2. Verify Admin Status (Direct Check)
select exists(
        select 1
        from public.profiles
        where id = caller_id
            and is_admin = true
    ) into is_admin_check;
if not is_admin_check then raise exception 'DEBUG_ERROR: Access Denied. User % is NOT marked as admin in public.profiles.',
caller_id;
end if;
-- 3. Resolve Target User
select id into target_id
from auth.users
where lower(email) = lower(target_email);
if target_id is null then raise exception 'DEBUG_ERROR: Target user with email % not found in auth.users.',
target_email;
end if;
-- 4. Execute Update
update public.profiles
set credits = credits + amount
where id = target_id;
-- 5. Verify Update
if not found then raise exception 'DEBUG_ERROR: Update failed. Target ID % exists in Auth but likely missing in Profiles.',
target_id;
end if;
end;
$$;