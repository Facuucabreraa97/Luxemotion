// api/get-models.js
// Public endpoint: returns active AI models grouped by tier
import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 10 };
export const dynamic = 'force-dynamic';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Missing configuration' });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data, error } = await supabase
            .from('ai_models')
            .select('id, display_name, tier, credits_cost, credits_cost_10s, resolution, max_duration, fal_model_id')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;

        // Group by tier
        const grouped = {
            image: [],
            draft: [],
            master: []
        };

        for (const model of (data || [])) {
            const entry = {
                id: model.id,
                name: model.display_name,
                cost: model.credits_cost,
                cost_10s: model.credits_cost_10s || null,
                resolution: model.resolution,
                max_duration: model.max_duration
            };

            if (grouped[model.tier]) {
                grouped[model.tier].push(entry);
            }
        }

        // Cache for 60s to reduce DB load
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        return res.status(200).json(grouped);

    } catch (error) {
        console.error('[GET-MODELS] Error:', error instanceof Error ? error.message : 'Unknown');
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
