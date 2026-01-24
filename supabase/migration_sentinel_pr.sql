-- Add Column for Self-Healing
ALTER TABLE public.admin_reports ADD COLUMN IF NOT EXISTS suggested_fix_pr_url TEXT;

-- Enable Realtime for the table so the Console updates instantly
alter publication supabase_realtime add table public.admin_reports;
