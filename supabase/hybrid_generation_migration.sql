-- HYBRID GENERATION: Draft vs Master
-- Adds quality_tier tracking to generations table
BEGIN;
ALTER TABLE public.generations
ADD COLUMN IF NOT EXISTS quality_tier text DEFAULT 'master';
ALTER TABLE public.generations
ADD COLUMN IF NOT EXISTS cost_in_credits integer DEFAULT 0;
ALTER TABLE public.generations
ADD COLUMN IF NOT EXISTS fal_model_id text DEFAULT NULL;
COMMENT ON COLUMN public.generations.quality_tier IS 'draft (Wan-2.1 cheap) or master (Kling Pro)';
COMMENT ON COLUMN public.generations.cost_in_credits IS 'Actual credits charged for this generation';
COMMENT ON COLUMN public.generations.fal_model_id IS 'fal.ai model endpoint used, for status polling';
COMMIT;