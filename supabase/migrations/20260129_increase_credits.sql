-- Function to safely increment user credits atomically
-- Run this in your Supabase SQL Editor
create or replace function increase_credits(user_id uuid, amount int) returns void language plpgsql security definer as $$ begin
update profiles
set credits = credits + amount
where id = user_id;
end;
$$;