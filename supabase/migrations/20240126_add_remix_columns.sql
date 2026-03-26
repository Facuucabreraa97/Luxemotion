-- Migration: Add Remix Support Columns to 'talents' table
-- Created: 2026-01-26
-- Description: Adds columns for seed, generation config, prompt structure, and public visibility.
-- 1. Add 'seed' column to store the specific random seed used for generation (Replicate returns this).
-- Using bigint (int8) to ensure we can store large integer seeds.
ALTER TABLE talents
ADD COLUMN IF NOT EXISTS seed bigint;
-- 2. Add 'generation_config' to store technical parameters (steps, guidance_scale, scheduler, etc.)
-- Using JSONB for flexibility as parameters change between models.
ALTER TABLE talents
ADD COLUMN IF NOT EXISTS generation_config jsonb;
-- 3. Add 'prompt_structure' to store the breakdown of the final prompt (User Prompt vs System Prompt).
-- Useful for reconstructing the prompt without the hardcoded "Shot on ARRI..." if we change it later.
ALTER TABLE talents
ADD COLUMN IF NOT EXISTS prompt_structure jsonb;
-- 4. Add 'is_public' to distinguish between assets that are viewable by everyone vs just the creator.
-- Default is false (Private) to respect privacy by default.
ALTER TABLE talents
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;
-- 5. Create an index on 'is_public' for faster filtering in the public feed.
CREATE INDEX IF NOT EXISTS idx_talents_is_public ON talents(is_public);