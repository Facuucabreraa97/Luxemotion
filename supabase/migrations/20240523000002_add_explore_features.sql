/*
  Migration: Add Explore and Marketplace features
  Description: Adds columns for public visibility and marketplace functionality to generations and talents tables.
*/

-- Update generations table
ALTER TABLE generations ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Update talents table
ALTER TABLE talents ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;
ALTER TABLE talents ADD COLUMN IF NOT EXISTS price integer DEFAULT NULL;
ALTER TABLE talents ADD COLUMN IF NOT EXISTS for_sale boolean DEFAULT false;

-- Add RLS policies for public access (Read-only for public items)

-- Generations: Allow anyone to read public generations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'generations'
        AND policyname = 'Anyone can view public generations'
    ) THEN
        CREATE POLICY "Anyone can view public generations" ON generations
        FOR SELECT USING (is_public = true);
    END IF;
END
$$;

-- Talents: Allow anyone to read public talents
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'talents'
        AND policyname = 'Anyone can view public talents'
    ) THEN
        CREATE POLICY "Anyone can view public talents" ON talents
        FOR SELECT USING (is_public = true OR for_sale = true);
    END IF;
END
$$;
