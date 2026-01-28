-- TRACK GENERATIONS
-- Run in Supabase SQL Editor
create table if not exists public.generations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users not null,
    replicate_id text unique,
    status text not null default 'starting',
    -- starting, processing, succeeded, failed, canceled
    prompt text,
    image_url text,
    -- The result
    input_params jsonb,
    -- Store config used
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
-- RLS
alter table public.generations enable row level security;
create policy "Users can view own generations" on public.generations for
select using (auth.uid() = user_id);
create policy "Users can insert own generations" on public.generations for
insert with check (auth.uid() = user_id);
create policy "Users can update own generations" on public.generations for
update using (auth.uid() = user_id);