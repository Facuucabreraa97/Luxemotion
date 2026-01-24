-- 1. IDENTIFY AND CLEAN UP DUPLICATES
-- Logic: Keep records that are already SOLD or FOR SALE first, then older records.
DELETE FROM talents
WHERE id IN (
    SELECT id FROM (
        SELECT 
            id, 
            ROW_NUMBER() OVER (
                PARTITION BY source_generation_id 
                ORDER BY 
                    is_sold DESC,       -- Priority 1: Keep sold items (revenue)
                    is_for_sale DESC,   -- Priority 2: Keep active listings
                    sales_count DESC,   -- Priority 3: Keep items with history
                    created_at ASC      -- Priority 4: Keep oldest original
            ) as rnum
        FROM talents
        WHERE source_generation_id IS NOT NULL
    ) t
    WHERE t.rnum > 1
);

-- 2. ADD CONSTRAINT
-- Now that duplicates are gone, we can enforce uniqueness physically.
ALTER TABLE talents ADD CONSTRAINT unique_source_generation UNIQUE (source_generation_id);

-- 3. VERIFY
-- This table is now protected. No two talents can share the same source_generation_id.
