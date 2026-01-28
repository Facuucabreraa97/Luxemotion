-- FIX ADMIN FUNCTION V2 (SIMPLIFIED)
-- Run this in Supabase SQL Editor
-- We are switching to check EVERYTHING against 'public.profiles'.
-- This avoids any weird permission issues with accessing the 'auth' schema.
create or replace function admin_update_credits(target_email text, amount int) returns void language plpgsql security definer
SET search_path = public,
    extensions -- Force Public schema context
    as $$
declare caller_id uuid;
target_id uuid;
begin -- 1. Get Caller ID
caller_id := auth.uid();
if caller_id is null then raise exception 'ERROR_NO_AUTH: You are not logged in.';
end if;
-- 2. Verify Admin (Looking only at public table)
if not exists (
    select 1
    from public.profiles
    where id = caller_id
        and is_admin = true
) then raise exception 'ERROR_NOT_ADMIN: Database permissions check failed for user %',
caller_id;
end if;
-- 3. Find User ID by Email (Looking only at public table)
-- Since we verified your email exists in profiles, this must work.
select id into target_id
from public.profiles
where lower(email) = lower(target_email);
if target_id is null then raise exception 'ERROR_USER_NOT_FOUND: Could not find user % in public.profiles table',
target_email;
end if;
-- 4. Execute Credit Update
update public.profiles
set credits = credits + amount
where id = target_id;
-- 5. Double Check
if not found then raise exception 'ERROR_UPDATE_FAILED: Update ran but no row was changed.';
end if;
end;
$$;