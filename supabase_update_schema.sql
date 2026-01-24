
-- Add locked column to generations to prevent reuse of sold assets
ALTER TABLE generations ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE;

-- Add source_generation_id to talents to track origin
ALTER TABLE talents ADD COLUMN IF NOT EXISTS source_generation_id UUID REFERENCES generations(id);
