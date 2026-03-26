-- 1. Add is_sold to talents
ALTER TABLE talents ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT FALSE;

-- 2. Add is_sold to generations (to explicitly track used sources)
ALTER TABLE generations ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT FALSE;

-- 3. Data Migration (Preserve History)
-- If a talent has been sold (sales_count > 0), mark it as is_sold.
UPDATE talents SET is_sold = TRUE WHERE sales_count > 0;

-- If a generation was previously locked (commercialized), mark it as is_sold.
UPDATE generations SET is_sold = TRUE WHERE locked = TRUE;

-- 4. Update Policies (Optional but recommended)
-- Ensure public can view sold status if needed, or keep restricted.
