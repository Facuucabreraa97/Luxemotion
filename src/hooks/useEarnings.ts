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
    isExample?: boolean;
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

                // Fetch Sold Assets (History: The records I marked as Sold)
                // Filter: created by me AND is_sold = true.
                const { data, error } = await supabase
                    .from('talents')
                    .select('*')
                    .eq('original_creator_id', session.user.id)
                    .eq('is_sold', true)
                    .order('created_at', { ascending: false });

                let items = data || [];

                // MOCK LOGIC (If empty, show examples)
                if (items.length === 0) {
                    items = [
                        {
                            id: 'mock-1',
                            name: 'Cyberpunk Diva (Example)',
                            image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
                            price: 1500,
                            sales_count: 1,
                            is_sold: true,
                            created_at: new Date().toISOString(),
                            isExample: true
                        },
                        {
                            id: 'mock-2',
                            name: 'Neon Samurai (Example)',
                            image_url: 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=2564&auto=format&fit=crop',
                            price: 2400,
                            sales_count: 1,
                            is_sold: true,
                            created_at: new Date().toISOString(),
                            isExample: true
                        },
                        {
                            id: 'mock-3',
                            name: 'Digital Soul (Example)',
                            image_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2564&auto=format&fit=crop',
                            price: 900,
                            sales_count: 1,
                            is_sold: true,
                            created_at: new Date().toISOString(),
                            isExample: true
                        }
                    ];
                }

                setEarnings(items);

                // Calculate Stats
                const total = items.reduce((acc, item) => acc + (item.price || 90), 0); // Default 90 if no price
                const count = items.length;
                const royalties = total * 0.10; // 10% Mock Royalty

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
