-- FIX ADMIN FUNCTIONS (Remove Hardcoded Emails, Use is_admin)
-- Run this in Supabase SQL Editor
-- 1. Secure Function: Get Admin Stats
create or replace function get_admin_stats() returns json language plpgsql security definer as $$
declare result json;
begin -- Security Check: Use helper function
if not public.check_is_admin() then raise exception 'Access Denied: You are not an admin';
end if;
select json_build_object(
        'total_users',
        (
            select count(*)
            from public.whitelist
            where status = 'approved'
        ),
        'pending_requests',
        (
            select count(*)
            from public.whitelist
            where status = 'pending'
        ),
        'total_credits',
        (
            select coalesce(sum(credits), 0)
            from public.profiles
        ),
        'active_users_24h',
        (
            select count(*)
            from auth.users
            where last_sign_in_at > now() - interval '24 hours'
        )
    ) into result;
return result;
end;
$$;
-- 2. Secure Function: Update User Credits
create or replace function admin_update_credits(target_email text, amount int) returns void language plpgsql security definer as $$
declare target_id uuid;
begin -- Security Check
if not public.check_is_admin() then raise exception 'Access Denied';
end if;
-- Get User ID from email (Case insensitive search)
select id into target_id
from auth.users
where lower(email) = lower(target_email);
if target_id is null then raise exception 'User not found in Auth system';
end if;
update public.profiles
set credits = credits + amount
where id = target_id;
end;
$$;
-- 3. Secure Function: Ban/Unban User
create or replace function admin_toggle_ban(target_email text, ban boolean) returns void language plpgsql security definer as $$
declare new_status whitelist_status;
begin -- Security Check
if not public.check_is_admin() then raise exception 'Access Denied';
end if;
new_status := case
    when ban then 'rejected'
    else 'approved'
end;
update public.whitelist
set status = new_status
where lower(email) = lower(target_email);
end;
$$;
-- 4. Secure Function: Delete User
create or replace function admin_delete_user(target_email text) returns void language plpgsql security definer as $$ begin -- Security Check
    if not public.check_is_admin() then raise exception 'Access Denied';
end if;
delete from public.whitelist
where lower(email) = lower(target_email);
end;
$$;