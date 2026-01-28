-- MIGRATION: UPDATE GENERATIONS TABLE
-- Run this in Supabase SQL Editor
-- Safely adds columns only if they are missing.
DO $$ BEGIN -- 1. Add 'status' if missing
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'generations'
        AND column_name = 'status'
) THEN
ALTER TABLE public.generations
ADD COLUMN status text DEFAULT 'starting';
END IF;
-- 2. Add 'replicate_id' if missing
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'generations'
        AND column_name = 'replicate_id'
) THEN
ALTER TABLE public.generations
ADD COLUMN replicate_id text UNIQUE;
END IF;
-- 3. Add 'image_url' (result) if missing
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'generations'
        AND column_name = 'image_url'
) THEN
ALTER TABLE public.generations
ADD COLUMN image_url text;
END IF;
-- 4. Add 'prompt' if missing
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'generations'
        AND column_name = 'prompt'
) THEN
ALTER TABLE public.generations
ADD COLUMN prompt text;
END IF;
-- 5. Add 'input_params' if missing
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'generations'
        AND column_name = 'input_params'
) THEN
ALTER TABLE public.generations
ADD COLUMN input_params jsonb;
END IF;
-- 6. Add 'progress' column for the UI bar (0-100)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'generations'
        AND column_name = 'progress'
) THEN
ALTER TABLE public.generations
ADD COLUMN progress int DEFAULT 0;
END IF;
END $$;
-- Enable RLS just in case (Idempotent)
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
-- Grants
GRANT ALL ON public.generations TO authenticated;
GRANT ALL ON public.generations TO service_role;