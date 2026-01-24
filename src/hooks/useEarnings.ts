import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface EarningItem {
    id: string;
    name: string;
    image_url: string;
    price: number;
    sales_count: number;
    is_sold: boolean;
    created_at: string;
    // Relations
    generations?: {
        id: string;
        image_url: string;
        video_url?: string;
    };
}

export const useEarnings = () => {
    const [earnings, setEarnings] = useState<EarningItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalError: 0, count: 0, royalties: 0 });

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                // RELATIONAL QUERY: Talents + Original Generation (Source Video)
                // Using left join on 'generations' via source_video_id (automatically detected if FK exists)
                const { data, error } = await supabase
                    .from('talents')
                    .select('*, generations(*)')
                    .eq('original_creator_id', session.user.id)
                    .eq('is_sold', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // MAPPING
                const items = (data || []).map((t: any) => ({
                    ...t,
                    image_url: t.generations?.image_url || t.image_url || 'https://via.placeholder.com/500x1000?text=No+Image', // Enhanced Fallback
                }));

                setEarnings(items);

                // Calculate Stats
                const total = items.reduce((acc: number, item: any) => acc + (item.price || 90), 0);
                const count = items.length;
                const royalties = total * 0.10; // 10% Royalty

                setStats({ totalError: total, count, royalties });

            } catch (error) {
                console.error("Earnings Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEarnings();
    }, []);

    return { earnings, loading, stats };
};
