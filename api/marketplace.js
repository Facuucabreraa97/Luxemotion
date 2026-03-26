// api/marketplace.js
// Marketplace operations: search, like/unlike, record views
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth (optional for search, required for like/view)
    const authHeader = req.headers.authorization;
    let user = null;

    if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user: authUser } } = await supabase.auth.getUser(token);
        user = authUser;
    }

    // Create user-scoped client for RPC calls that need auth.uid()
    const getUserClient = () => {
        if (!authHeader) return null;
        const token = authHeader.replace('Bearer ', '');
        return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseServiceKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });
    };

    try {
        // ── GET: Search marketplace ──
        if (req.method === 'GET') {
            const { category, tag, search, sort, limit, offset } = req.query;

            const { data, error } = await supabase.rpc('marketplace_search', {
                p_category: category || null,
                p_tag: tag || null,
                p_search: search || null,
                p_sort: sort || 'trending',
                p_limit: parseInt(limit) || 20,
                p_offset: parseInt(offset) || 0,
            });

            if (error) throw error;

            // If user is authenticated, also fetch their likes
            let userLikes = [];
            if (user) {
                const userClient = getUserClient();
                if (userClient) {
                    const { data: likes } = await userClient.rpc('get_user_likes');
                    userLikes = likes || [];
                }
            }

            return res.status(200).json({
                ...data,
                user_likes: userLikes,
            });
        }

        // ── POST: Like/Unlike or Record View ──
        if (req.method === 'POST') {
            if (!user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const { action, talent_id } = req.body;

            if (!talent_id) {
                return res.status(400).json({ error: 'talent_id required' });
            }

            const userClient = getUserClient();
            if (!userClient) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            if (action === 'like') {
                const { data, error } = await userClient.rpc('toggle_like', {
                    p_talent_id: talent_id,
                });
                if (error) throw error;
                return res.status(200).json(data);
            }

            if (action === 'view') {
                const { data, error } = await userClient.rpc('record_view', {
                    p_talent_id: talent_id,
                });
                if (error) throw error;
                return res.status(200).json(data);
            }

            return res.status(400).json({ error: 'Invalid action. Use "like" or "view".' });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Marketplace API Error:', error instanceof Error ? error.message : 'Unknown');
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
