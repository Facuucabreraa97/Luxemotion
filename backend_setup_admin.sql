-- RUN THIS IN SUPABASE SQL EDITOR
-- 1. Create Consolidated Admin View
-- Joins whitelist info with auth/profile info for a complete picture
create or replace view admin_users_view as
select w.email,
    w.status as whitelist_status,
    w.created_at as applied_at,
    au.id as user_id,
    au.last_sign_in_at,
    p.credits,
    -- p.full_name,
    p.avatar_url
from public.whitelist w
    left join auth.users au on lower(au.email) = lower(w.email)
    left join public.profiles p on p.id = au.id;
-- 2. Secure Function: Get Admin Stats
create or replace function get_admin_stats() returns json language plpgsql security definer as $$
declare curr_email text;
result json;
begin -- Security Check
select auth.jwt()->>'email' into curr_email;
if curr_email not in ('dmsfak@proton.me', 'tu@email.com') then raise exception 'Access Denied: You are not an admin';
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
-- 3. Secure Function: Update User Credits (Add/Remove)
create or replace function admin_update_credits(target_email text, amount int) returns void language plpgsql security definer as $$
declare curr_email text;
target_id uuid;
begin
select auth.jwt()->>'email' into curr_email;
if curr_email not in ('dmsfak@proton.me', 'tu@email.com') then raise exception 'Access Denied';
end if;
-- Get User ID from email
select id into target_id
from auth.users
where email = target_email;
if target_id is null then raise exception 'User not found in Auth system (User might be approved but has not signed up yet)';
end if;
update public.profiles
set credits = credits + amount
where id = target_id;
end;
$$;
-- 4. Secure Function: Ban/Unban User
create or replace function admin_toggle_ban(target_email text, ban boolean) returns void language plpgsql security definer as $$
declare curr_email text;
new_status whitelist_status;
begin
select auth.jwt()->>'email' into curr_email;
if curr_email not in ('dmsfak@proton.me', 'tu@email.com') then raise exception 'Access Denied';
end if;
new_status := case
    when ban then 'rejected'
    else 'approved'
end;
-- Update Whitelist to block/allow access
update public.whitelist
set status = new_status
where lower(email) = lower(target_email);
end;
$$;
-- 5. Secure Function: Delete User (Hard Delete)
-- WARNING: This deletes from whitelist. Auth user and profile cleanup depends on Supabase cascades.
create or replace function admin_delete_user(target_email text) returns void language plpgsql security definer as $$
declare curr_email text;
target_id uuid;
begin
select auth.jwt()->>'email' into curr_email;
if curr_email not in ('dmsfak@proton.me', 'tu@email.com') then raise exception 'Access Denied';
end if;
-- Delete from whitelist (Primary access control)
delete from public.whitelist
where lower(email) = lower(target_email);
-- Note: We don't delete from auth.users here as it requires elevated permissions usually not available to postgres role easily without config.
-- But removing from whitelist blocks their access immediately.
end;
$$;