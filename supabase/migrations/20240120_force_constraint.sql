-- 1. DELETE PREVIOUS CONSTRAINT (IF FAILED)
ALTER TABLE talents DROP CONSTRAINT IF EXISTS unique_source_generation;
ALTER TABLE talents DROP CONSTRAINT IF EXISTS unique_generation_lock;

-- 2. INFALLIBLE CLEANUP (Deleting strictly duplicates)
DELETE FROM talents
WHERE id IN (
    SELECT id FROM (
        SELECT 
            id, 
            ROW_NUMBER() OVER (
                PARTITION BY source_generation_id 
                ORDER BY created_at ASC
            ) as rnum
        FROM talents
        WHERE source_generation_id IS NOT NULL
    ) t
    WHERE t.rnum > 1
);

-- 3. FORCE THE LOCK
ALTER TABLE talents ADD CONSTRAINT unique_generation_lock UNIQUE (source_generation_id);
