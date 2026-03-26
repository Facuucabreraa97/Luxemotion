-- CLEANUP PROFILES SCHEMA
-- Run this in Supabase SQL Editor
-- 1. SAFETY FIRST: Create a Backup Table
-- This saves a snapshot of your data before we delete anything.
CREATE TABLE public.profiles_backup_2026_01_28 AS
SELECT *
FROM public.profiles;
-- 2.1 CLEANUP LEGACY VIEWS
-- These views depend on the 'status' column we are about to delete.
-- The app now uses 'get_admin_stats' RPC and 'admin_users_view', so these are safe to remove.
DROP VIEW IF EXISTS public.admin_metrics;
DROP VIEW IF EXISTS public.real_time_metrics;
-- 2.2 REMOVE REDUNDANT COLUMNS
-- Based on code audit:
-- 'role' -> Replaced by 'is_admin'
-- 'access_status', 'status' -> Managed by 'whitelist' table and 'admin_users_view'
-- 'plan' -> No active subscription logic found
-- 'velvet_access' -> Dead feature
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role,
    DROP COLUMN IF EXISTS access_status,
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS velvet_access;
-- 3. CONFIRMATION
-- Verify the new lean schema
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'profiles';