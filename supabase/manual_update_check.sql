-- MANUAL DEBUG SCRIPT
-- Run this in Supabase SQL Editor.
-- This will tell us if the database is broken or if the API is the problem.
BEGIN;
-- 1. Try to update manually (This will show the REAL error if any)
UPDATE public.profiles
SET credits = 225
WHERE id = '8a6921ec-921b-428a-a8f3-8b747632f764';
-- 2. Inspect Triggers (Are there any invisible triggers blocking us?)
SELECT trigger_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';
ROLLBACK;
-- We rollback so we don't actually change data, just test validity.