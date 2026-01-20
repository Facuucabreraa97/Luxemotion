-- Migration: Fix Schema Inconsistencies & Add Missing Columns
-- Description: Standardizes 'is_for_sale', removes 'for_sale' ghost column, ensures 'locked' and 'sales_count' exist.

-- 1. Standardize 'is_for_sale' on 'talents' table
ALTER TABLE talents ADD COLUMN IF NOT EXISTS is_for_sale BOOLEAN DEFAULT FALSE;

-- Migrate data from legacy 'for_sale' if it exists and is true
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'talents' AND column_name = 'for_sale') THEN
        UPDATE talents SET is_for_sale = TRUE WHERE for_sale = TRUE;
    END IF;
END $$;

-- Drop legacy 'for_sale' column to prevent "Zombie" state (Schezophrenia fix)
ALTER TABLE talents DROP COLUMN IF EXISTS for_sale;

-- 2. Ensure 'generations' table has 'locked' column (Security)
ALTER TABLE generations ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE;

-- 3. Ensure 'talents' table has 'sales_count' and 'source_generation_id'
ALTER TABLE talents ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;
ALTER TABLE talents ADD COLUMN IF NOT EXISTS source_generation_id UUID REFERENCES generations(id);

-- 4. Cleanup any potential ghost columns that code was trying to use but shouldn't exist
ALTER TABLE talents DROP COLUMN IF EXISTS sold;
ALTER TABLE talents DROP COLUMN IF EXISTS is_sold;
