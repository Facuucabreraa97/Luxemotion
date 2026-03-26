// api/admin-dashboard.js
// Secure endpoint for admin analytics — calls get_admin_dashboard() RPC
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Verify Authentication
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Missing Authorization' });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid Token' });
        }

        // 2. Verify Admin (server-side, never trust frontend)
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // 3. Call RPC with user's JWT context
        // We use the user's token to create an authenticated client
        const userSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseServiceKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { data, error } = await userSupabase.rpc('get_admin_dashboard');

        if (error) {
            console.error('Dashboard RPC Error:', error.message);
            // Fallback: run with service role if RPC auth fails
            const { data: fallback, error: fbError } = await supabase.rpc('get_admin_dashboard');
            
            // If even service role fails, build manual response
            if (fbError) {
                // Manual query fallback
                const [users, gens, talents, txs] = await Promise.all([
                    supabase.from('profiles').select('id, credits, plan_tier, is_admin, created_at'),
                    supabase.from('generations').select('id, status, quality_tier, cost_in_credits, fal_model_id, created_at'),
                    supabase.from('talents').select('id, is_draft, for_sale, price, sales_count'),
                    supabase.from('transactions').select('id, amount, review_status, payment_method, type, reviewed_at, created_at'),
                ]);

                const profilesData = users.data || [];
                const gensData = gens.data || [];
                const talentsData = talents.data || [];
                const txsData = txs.data || [];

                const activeModels = await supabase.from('ai_models').select('display_name, tier').eq('is_active', true);

                return res.status(200).json({
                    success: true,
                    users: {
                        total: profilesData.length,
                        admins: profilesData.filter(p => p.is_admin).length,
                        active_plans: profilesData.filter(p => p.plan_tier && p.plan_tier !== 'free').length,
                    },
                    credits: {
                        total_in_circulation: profilesData.reduce((s, p) => s + (Number(p.credits) || 0), 0),
                        avg_per_user: Math.round(profilesData.reduce((s, p) => s + (Number(p.credits) || 0), 0) / Math.max(profilesData.length, 1)),
                        total_approved_revenue: txsData.filter(t => t.review_status === 'approved' && t.type === 'PURCHASE').reduce((s, t) => s + (t.amount || 0), 0),
                        pending_review_count: txsData.filter(t => t.review_status === 'pending_review').length,
                    },
                    generations: {
                        total: gensData.length,
                        succeeded: gensData.filter(g => g.status === 'succeeded').length,
                        failed: gensData.filter(g => g.status === 'failed').length,
                        total_credits_spent: gensData.filter(g => g.status === 'succeeded').reduce((s, g) => s + (g.cost_in_credits || 0), 0),
                    },
                    marketplace: {
                        total_assets: talentsData.filter(t => !t.is_draft).length,
                        drafts: talentsData.filter(t => t.is_draft).length,
                        listed_for_sale: talentsData.filter(t => t.for_sale).length,
                        total_sales: talentsData.reduce((s, t) => s + (t.sales_count || 0), 0),
                    },
                    system: {
                        active_master: (activeModels.data || []).find(m => m.tier === 'master')?.display_name || 'Unknown',
                        active_draft: (activeModels.data || []).find(m => m.tier === 'draft')?.display_name || 'Unknown',
                        active_image: (activeModels.data || []).find(m => m.tier === 'image')?.display_name || 'Unknown',
                    },
                    revenue_timeline: [],
                    generation_timeline: [],
                    top_creators: [],
                    payment_methods: [],
                    _source: 'fallback',
                });
            }
            return res.status(200).json(fallback);
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('Admin Dashboard Error:', error instanceof Error ? error.message : 'Unknown');
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
