-- RUN THIS IN SUPABASE SQL EDITOR
-- 1. Create Whitelist Table
create type whitelist_status as enum ('pending', 'approved', 'rejected');
create table public.whitelist (
    email text primary key,
    status whitelist_status default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- 2. Enable RLS
alter table public.whitelist enable row level security;
-- 3. Policies
-- Allow anyone to insert (Apply for waitlist)
create policy "Allow public insert" on public.whitelist for
insert with check (true);
-- Allow anyone to read (Check status) - In production you might want to limit this, but needed for login check
create policy "Allow public read" on public.whitelist for
select using (true);
-- Allow admins to update (We will handle admin check in app logic or via separate admin role if needed)
-- For now, allow authenticated users to update (Security warning: Ideally restrict to specific UUIDs)
create policy "Allow update for authenticated" on public.whitelist for
update using (auth.role() = 'authenticated');
-- 4. Insert your Admin Email immediately so you are approved
insert into public.whitelist (email, status)
values ('tu@email.com', 'approved'),
    -- Example
    ('facu.cabreraa97@gmail.com', 'approved');
-- Assuming this is your email based on repo name