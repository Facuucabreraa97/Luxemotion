-- ═══════════════════════════════════════════════════════════
-- AI MODELS CONFIGURATION TABLE (v2 — with business intelligence)
-- Admin-managed model catalog for dynamic generation routing
-- ═══════════════════════════════════════════════════════════
-- 1. Drop existing table
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
    -- Business Intelligence columns
    api_cost_usd TEXT,
    -- Real API cost per generation (e.g. "$0.03/img")
    margin_note TEXT,
    -- Profit margin note
    pros TEXT,
    -- Key advantages
    cons TEXT,
    -- Key disadvantages / risks
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 3. RLS Policies
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_models_select" ON ai_models FOR
SELECT TO authenticated USING (true);
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
-- ═══════════════════════════════════════════════════
-- 4. SEED: IMAGE MODELS
-- ═══════════════════════════════════════════════════
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
        sort_order,
        api_cost_usd,
        margin_note,
        pros,
        cons
    )
VALUES (
        'flux-dev-i2i',
        'image',
        'fal',
        'fal-ai/flux/dev/image-to-image',
        'Flux Dev (img→img)',
        'Transform existing images with AI. Our core image tool for product styling and creative edits.',
        'image',
        15,
        '1344×768',
        true,
        1,
        '$0.03 / image',
        '15 CR = ~$0.47 revenue vs $0.03 cost → 93% margin',
        '✦ Extremely profitable (93% margin)\n✦ Fast generation (~4s)\n✦ Great for product transforms\n✦ Battle-tested in production',
        '⚠ No text rendering in images\n⚠ Strength must be tuned per use case'
    ),
    (
        'flux-dev-t2i',
        'image',
        'fal',
        'fal-ai/flux/dev',
        'Flux Dev (text→img)',
        'Generate images from text descriptions. Fast, versatile text-to-image generation.',
        'image',
        15,
        '1344×768',
        true,
        2,
        '$0.025 / image',
        '15 CR = ~$0.47 revenue vs $0.025 cost → 95% margin',
        '✦ Highest margin image model (95%)\n✦ Fast generation (~3s)\n✦ No input image required\n✦ Good general-purpose quality',
        '⚠ Less precise than img2img\n⚠ Prompt engineering required'
    ),
    (
        'flux-pro',
        'image',
        'fal',
        'fal-ai/flux-pro/v1.1',
        'Flux Pro 1.1',
        'Premium image quality with enhanced fidelity, sharpness, and detail preservation.',
        'image',
        25,
        '1344×768',
        false,
        3,
        '$0.04 / image',
        '25 CR = ~$0.78 revenue vs $0.04 cost → 95% margin',
        '✦ Highest image quality available\n✦ Better detail preservation\n✦ Still very high margin (95%)\n✦ Worth premium pricing',
        '⚠ 1.5x slower than Flux Dev\n⚠ Users may not perceive quality difference'
    ),
    (
        'sdxl-lightning',
        'image',
        'fal',
        'fal-ai/fast-lightning-sdxl',
        'SDXL Lightning',
        'Ultra-fast image generation in ~2 seconds. Ideal for rapid iterations and previews.',
        'image',
        5,
        '1024×1024',
        false,
        4,
        '$0.001 / image',
        '5 CR = ~$0.16 revenue vs $0.001 cost → 99% margin',
        '✦ Near-zero cost (99% margin!)\n✦ Fastest generation (~2s)\n✦ Great for quick previews\n✦ Lowest barrier for users',
        '⚠ Lower quality than Flux\n⚠ Less realistic outputs\n⚠ May devalue premium perception'
    ),
    (
        'ideogram-v3',
        'image',
        'fal',
        'fal-ai/ideogram/v3',
        'Ideogram V3',
        'Industry-leading text rendering in images. Perfect for logos, labels, and branded content.',
        'image',
        20,
        '1024×1024',
        false,
        5,
        '$0.05 / image',
        '20 CR = ~$0.63 revenue vs $0.05 cost → 92% margin',
        '✦ Best text-in-image rendering\n✦ Ideal for logo/brand mockups\n✦ Unique capability vs Flux\n✦ High margin (92%)',
        '⚠ Slower generation (~8s)\n⚠ Niche use case (text in images)\n⚠ Less versatile for general imagery'
    );
-- ═══════════════════════════════════════════════════
-- 5. SEED: VIDEO DRAFT MODELS
-- ═══════════════════════════════════════════════════
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
        input_schema,
        api_cost_usd,
        margin_note,
        pros,
        cons
    )
VALUES (
        'wan-i2v',
        'video',
        'fal',
        'fal-ai/wan-i2v',
        'Wan 2.1 (img→vid)',
        'Fast 480p video drafts from images. Test motion and composition before mastering.',
        'draft',
        50,
        '480p',
        '5s',
        true,
        10,
        '{"num_frames": 81, "image_size": {"width": 854, "height": 480}}'::jsonb,
        '$0.80 / 5s video',
        '50 CR = ~$1.56 revenue vs $0.80 cost → 49% margin',
        '✦ Good preview quality\n✦ Reliable motion generation\n✦ Open-source model (no vendor lock)\n✦ Battle-tested in production',
        '⚠ Lower margin (49%) vs images\n⚠ 480p only (draft quality)\n⚠ ~60s generation time'
    ),
    (
        'wan-t2v',
        'video',
        'fal',
        'fal-ai/wan/v2.1/turbo/text-to-video',
        'Wan 2.1 (text→vid)',
        'Text-to-video drafts without needing an input image. Pure prompt-driven creation.',
        'draft',
        50,
        '480p',
        '5s',
        false,
        11,
        '{"num_frames": 81}'::jsonb,
        '$0.80 / 5s video',
        '50 CR = ~$1.56 revenue vs $0.80 cost → 49% margin',
        '✦ No input image needed\n✦ Pure creative freedom\n✦ Same cost as img2vid variant\n✦ Useful for concept exploration',
        '⚠ Less control than img→vid\n⚠ 480p only\n⚠ Results can be unpredictable'
    ),
    (
        'minimax-hailuo',
        'video',
        'fal',
        'fal-ai/minimax/video-01',
        'Minimax Hailuo 02',
        'Fast social media optimized videos with realistic character motion and expressions.',
        'draft',
        60,
        '720p',
        '6s',
        false,
        12,
        '{}'::jsonb,
        '$0.28 / 6s video',
        '60 CR = ~$1.88 revenue vs $0.28 cost → 85% margin',
        '✦ Very high margin (85%!)\n✦ 720p (better than Wan 480p)\n✦ Great character expressions\n✦ Fast for social content',
        '⚠ Newer model, less tested\n⚠ May not handle products as well\n⚠ 6s fixed duration'
    );
-- ═══════════════════════════════════════════════════
-- 6. SEED: VIDEO MASTER MODELS
-- ═══════════════════════════════════════════════════
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
        input_schema,
        api_cost_usd,
        margin_note,
        pros,
        cons
    )
VALUES (
        'kling-v2.5-master',
        'video',
        'fal',
        'fal-ai/kling-video/v2/master/image-to-video',
        'Kling v2.5 Pro',
        'Cinema-grade 1080p video with multi-image support for product placement scenes.',
        'master',
        400,
        800,
        '1080p',
        '10s',
        true,
        20,
        '{"cfg_scale": 0.5, "negative_prompt": "blur, distort, low quality, wrong product, different person"}'::jsonb,
        '$1.40/5s · $2.80/10s ($0.28/sec)',
        '400 CR = ~$12.50 revenue vs $1.40 cost → 89% margin',
        '✦ High margin (89%)\n✦ Multi-image composition\n✦ Best product identity preservation\n✦ Battle-tested, reliable pipeline',
        '⚠ ~2-3 min generation time\n⚠ Occasional face distortion\n⚠ cfg_scale tuning needed'
    ),
    (
        'kling-v2.6',
        'video',
        'fal',
        'fal-ai/kling-video/v2.6/standard/image-to-video',
        'Kling 2.6',
        'Latest Kling with enhanced product detail retention and fashion-specific optimizations.',
        'master',
        350,
        700,
        '1080p',
        '10s',
        false,
        21,
        '{"cfg_scale": 0.5}'::jsonb,
        '$1.40/5s · $2.80/10s ($0.28/sec)',
        '350 CR = ~$10.94 revenue vs $1.40 cost → 87% margin',
        '✦ High margin (87%)\n✦ Better product/fashion detail\n✦ Newer model architecture\n✦ May outperform v2.5 for some use cases',
        '⚠ Less tested in our pipeline\n⚠ May behave differently with multi-image\n⚠ "standard" tier (not master quality)'
    ),
    (
        'minimax-hailuo-pro',
        'video',
        'fal',
        'fal-ai/minimax/video-01-live',
        'Hailuo 02 Pro',
        'Best character expressions and realistic physics simulation. Great for people-focused content.',
        'master',
        450,
        900,
        '1080p',
        '5s',
        false,
        22,
        '{}'::jsonb,
        '$0.49 / 5s video',
        '450 CR = ~$14.06 revenue vs $0.49 cost → 97% margin',
        '✦ Extremely high margin (97%)\n✦ Best character expressions\n✦ Realistic physics\n✦ 3x cheaper API than Kling',
        '⚠ 5s max duration (no 10s option)\n⚠ Multi-image may not work\n⚠ Different API input format'
    ),
    (
        'veo3',
        'video',
        'fal',
        'fal-ai/veo3',
        'Google Veo 3.1',
        'Google cinematic AI. Native 4K support with best film language understanding. Premium tier.',
        'master',
        500,
        1000,
        '4K',
        '8s',
        false,
        23,
        '{}'::jsonb,
        '$2.50/5s · $5.00/10s ($0.50/sec)',
        '500 CR = ~$15.63 revenue vs $2.50 cost → 84% margin',
        '✦ Best cinematic quality overall\n✦ Native 4K resolution\n✦ Google AI infrastructure\n✦ Film-level camera movement',
        '⚠ Most expensive API ($2.50/5s vs Kling $1.40/5s)\n⚠ Lower margin (84%) vs Kling (89%)\n⚠ New on fal.ai, less stable\n⚠ May have rate limit issues'
    );
-- 7. Grant permissions
GRANT SELECT ON ai_models TO authenticated;
GRANT ALL ON ai_models TO authenticated;