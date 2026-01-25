-- RUN THIS IN SUPABASE SQL EDITOR
-- 1. Create 'uploads' bucket for images
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true);
-- 2. Create Policy to allow public uploads (for demo)
create policy "Public Access" on storage.objects for all using (bucket_id = 'uploads') with check (bucket_id = 'uploads');
-- 3. Add 'is_draft' column to talents table
alter table public.talents
add column if not exists is_draft boolean default false;
-- 4. Add 'video_url' column if missing
alter table public.talents
add column if not exists video_url text;
-- 5. Fix RLS for Talents (Optional, if you have issues)
alter table public.talents enable row level security;
create policy "Enable read access for all users" on public.talents for
select using (true);
create policy "Enable insert for authenticated users only" on public.talents for
insert with check (auth.uid() = creator_id);
create policy "Enable update for owners" on public.talents for
update using (auth.uid() = owner_id);