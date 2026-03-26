// api/profile.js
// Profile operations: stats, publish, unpublish, delete asset
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) return res.status(500).json({ error: 'Server config error' });

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing Authorization' });

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    // User-scoped client for RPCs that use auth.uid()
    const userClient = createClient(supabaseUrl, supabaseServiceKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
    });

    try {
        // ── GET: Profile stats ──
        if (req.method === 'GET') {
            const { data, error } = await userClient.rpc('get_my_profile_stats');
            if (error) throw error;
            return res.status(200).json(data);
        }

        // ── POST: Actions ──
        if (req.method === 'POST') {
            const { action, talent_id, price, category, name, description } = req.body;

            if (!action) return res.status(400).json({ error: 'action required' });

            if (action === 'publish') {
                if (!talent_id || !price) return res.status(400).json({ error: 'talent_id and price required' });
                const { data, error } = await userClient.rpc('publish_asset', {
                    p_talent_id: talent_id,
                    p_price: parseInt(price),
                    p_category: category || 'other',
                    p_name: name || null,
                    p_description: description || null,
                });
                if (error) throw error;
                return res.status(200).json(data);
            }

            if (action === 'unpublish') {
                if (!talent_id) return res.status(400).json({ error: 'talent_id required' });
                const { data, error } = await userClient.rpc('unpublish_asset', { p_talent_id: talent_id });
                if (error) throw error;
                return res.status(200).json(data);
            }

            if (action === 'delete') {
                if (!talent_id) return res.status(400).json({ error: 'talent_id required' });
                const { data, error } = await userClient.rpc('delete_my_asset', { p_talent_id: talent_id });
                if (error) throw error;
                return res.status(200).json(data);
            }

            return res.status(400).json({ error: 'Invalid action. Use publish, unpublish, or delete.' });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Profile API Error:', error instanceof Error ? error.message : 'Unknown');
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
