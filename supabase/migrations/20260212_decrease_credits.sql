-- Function to safely decrement user credits atomically
-- Mirrors increase_credits but WITH balance protection
-- Run this in your Supabase SQL Editor
create or replace function decrease_credits(user_id uuid, amount int) returns void language plpgsql security definer as $$ begin -- Verify sufficient balance before deducting
    if (
        select credits
        from profiles
        where id = user_id
    ) < amount then raise exception 'Insufficient credits';
end if;
update profiles
set credits = credits - amount
where id = user_id;
end;
$$;