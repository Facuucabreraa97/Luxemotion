-- ═══════════════════════════════════════════════════════════
-- AI MODELS CONFIGURATION TABLE
-- Admin-managed model catalog for dynamic generation routing
-- ═══════════════════════════════════════════════════════════
-- 1. Drop existing (partial) table if any
DROP TABLE IF EXISTS ai_models CASCADE;
-- 2. Create Table
CREATE TABLE ai_models (
    id TEXT PRIMARY KEY,
    model_type TEXT NOT NULL CHECK (model_type IN ('image', 'video')),
    provider TEXT NOT NULL DEFAULT 'fal',
    fal_model_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    tier TEXT NOT NULL CHECK (tier IN ('image', 'draft', 'master')),
    credits_cost INTEGER NOT NULL,
    credits_cost_10s INTEGER,
    resolution TEXT,
    max_duration TEXT,
    is_active BOOLEAN DEFAULT false,
    input_schema JSONB DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. RLS Policies
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
-- All authenticated users can read (Studio needs to know active models)
CREATE POLICY "ai_models_select" ON ai_models FOR
SELECT TO authenticated USING (true);
-- Only admins can modify
CREATE POLICY "ai_models_update" ON ai_models FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND is_admin = true
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND is_admin = true
        )
    );
CREATE POLICY "ai_models_insert" ON ai_models FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND is_admin = true
        )
    );
CREATE POLICY "ai_models_delete" ON ai_models FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND is_admin = true
    )
);
-- 3. Seed: Image Models
INSERT INTO ai_models (
        id,
        model_type,
        provider,
        fal_model_id,
        display_name,
        description,
        tier,
        credits_cost,
        resolution,
        is_active,
        sort_order
    )
VALUES (
        'flux-dev-i2i',
        'image',
        'fal',
        'fal-ai/flux/dev/image-to-image',
        'Flux Dev (img→img)',
        'Transform existing images with AI. Best for product styling and edits.',
        'image',
        15,
        '1344×768',
        true,
        1
    ),
    (
        'flux-dev-t2i',
        'image',
        'fal',
        'fal-ai/flux/dev',
        'Flux Dev (text→img)',
        'Generate images from text descriptions. Fast and versatile.',
        'image',
        15,
        '1344×768',
        true,
        2
    ),
    (
        'flux-pro',
        'image',
        'fal',
        'fal-ai/flux-pro/v1.1',
        'Flux Pro 1.1',
        'Premium image quality with higher fidelity and detail.',
        'image',
        25,
        '1344×768',
        false,
        3
    ),
    (
        'sdxl-lightning',
        'image',
        'fal',
        'fal-ai/fast-lightning-sdxl',
        'SDXL Lightning',
        'Ultra-fast image generation (~2s). Great for quick iterations.',
        'image',
        5,
        '1024×1024',
        false,
        4
    ),
    (
        'ideogram-v3',
        'image',
        'fal',
        'fal-ai/ideogram/v3',
        'Ideogram V3',
        'Best-in-class text rendering in images. Ideal for logos and labels.',
        'image',
        20,
        '1024×1024',
        false,
        5
    );
-- 4. Seed: Video Draft Models
INSERT INTO ai_models (
        id,
        model_type,
        provider,
        fal_model_id,
        display_name,
        description,
        tier,
        credits_cost,
        resolution,
        max_duration,
        is_active,
        sort_order,
        input_schema
    )
VALUES (
        'wan-i2v',
        'video',
        'fal',
        'fal-ai/wan-i2v',
        'Wan 2.1 (img→vid)',
        'Fast 480p video drafts from images. Test motion before mastering.',
        'draft',
        50,
        '480p',
        '5s',
        true,
        10,
        '{"num_frames": 81, "image_size": {"width": 854, "height": 480}}'::jsonb
    ),
    (
        'wan-t2v',
        'video',
        'fal',
        'fal-ai/wan/v2.1/turbo/text-to-video',
        'Wan 2.1 (text→vid)',
        'Text-to-video drafts. No input image needed.',
        'draft',
        50,
        '480p',
        '5s',
        false,
        11,
        '{"num_frames": 81}'::jsonb
    ),
    (
        'minimax-hailuo',
        'video',
        'fal',
        'fal-ai/minimax/video-01',
        'Minimax Hailuo 02',
        'Fast social media videos with realistic character motion.',
        'draft',
        60,
        '720p',
        '6s',
        false,
        12,
        '{}'::jsonb
    );
-- 5. Seed: Video Master Models
INSERT INTO ai_models (
        id,
        model_type,
        provider,
        fal_model_id,
        display_name,
        description,
        tier,
        credits_cost,
        credits_cost_10s,
        resolution,
        max_duration,
        is_active,
        sort_order,
        input_schema
    )
VALUES (
        'kling-v2.5-master',
        'video',
        'fal',
        'fal-ai/kling-video/v2/master/image-to-video',
        'Kling v2.5 Pro',
        'Cinema-grade 1080p video. Multi-image support for product placement.',
        'master',
        400,
        800,
        '1080p',
        '10s',
        true,
        20,
        '{"cfg_scale": 0.5, "negative_prompt": "blur, distort, low quality, wrong product, different person"}'::jsonb
    ),
    (
        'kling-v2.6',
        'video',
        'fal',
        'fal-ai/kling-video/v2.6/standard/image-to-video',
        'Kling 2.6',
        'Enhanced product and fashion detail retention. Newer model.',
        'master',
        350,
        700,
        '1080p',
        '10s',
        false,
        21,
        '{"cfg_scale": 0.5}'::jsonb
    ),
    (
        'minimax-hailuo-pro',
        'video',
        'fal',
        'fal-ai/minimax/video-01-live',
        'Hailuo 02 Pro',
        'Best character expressions and realistic physics simulation.',
        'master',
        450,
        900,
        '1080p',
        '5s',
        false,
        22,
        '{}'::jsonb
    ),
    (
        'veo3',
        'video',
        'fal',
        'fal-ai/veo3',
        'Google Veo 3.1',
        'Google cinematic AI. Supports native 4K, best film language understanding.',
        'master',
        500,
        1000,
        '4K',
        '8s',
        false,
        23,
        '{}'::jsonb
    );
-- 6. Grant permissions
GRANT SELECT ON ai_models TO authenticated;
GRANT ALL ON ai_models TO authenticated;