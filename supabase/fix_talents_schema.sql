-- FIX TALENTS SCHEMA (Missing Description Column)
-- Run this in Supabase SQL Editor
-- The application attempts to save a 'description' field to the 'talents' table,
-- but the column does not exist, causing a PGRST204 error.
ALTER TABLE public.talents
ADD COLUMN IF NOT EXISTS description text;
-- Optional: Add a comment or verify
COMMENT ON COLUMN public.talents.description IS 'Description of the generated asset or talent';