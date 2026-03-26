-- FIX TALENTS SCHEMA (Missing Columns for Market/Studio)
-- Run this in Supabase SQL Editor
ALTER TABLE public.talents
ADD COLUMN IF NOT EXISTS for_sale boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;
-- Optional: Add comments
COMMENT ON COLUMN public.talents.for_sale IS 'Whether the asset is listed for sale';
COMMENT ON COLUMN public.talents.is_draft IS 'Whether the asset is still a draft (not minted)';