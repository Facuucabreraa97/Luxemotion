import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Play, Image as ImageIcon, Loader2, DollarSign, Lock, AlertCircle, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Interfaces based on actual DB schema (inferred)
interface Generation {
    id: string;
    url: string; // Or video_url/image_url depending on schema, we'll try to support both or verify
    image_url?: string;
    video_url?: string;
    prompt: string;
    type: 'image' | 'video';
    is_sold: boolean;
    is_for_sale: boolean;
    created_at: string;
}

export default function UnifiedGallery() {
    const { t } = useTranslation();
    const [items, setItems] = useState<Generation[]>([]);
    const [loading, setLoading] = useState(true);
    const [castingItem, setCastingItem] = useState<Generation | null>(null);
    const [price, setPrice] = useState(100);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // FETCH
    const fetchGallery = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch generations. 
        // We select * because we need all info. 
        // Note: The schema might use 'video_url' or 'url'. We'll adjust in render.
        const { data, error } = await supabase
            .from('generations')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Gallery Fetch Error:", error);
            setError("Failed to load gallery.");
        } else {
            setItems(data as Generation[] || []);
        }
        setLoading(false);
    };

    useEffect(() => { fetchGallery(); }, []);

    // HANDLE CASTING (SELL)
    const handleCast = async () => {
        if (!castingItem) return;
        setProcessing(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            // Use the verified API endpoint
            const res = await fetch('/api/talents/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
                body: JSON.stringify({
                    name: `Masterpiece #${castingItem.id.slice(0, 4)}`, // Default name
                    image_url: castingItem.image_url || castingItem.url || castingItem.video_url, // Fallback
                    price: price,
                    source_video_id: castingItem.id, // CRITICAL: Links 1/1 supply
                    is_for_sale: true,
                    // Additional fields if needed by backend logic
                    role: 'model', // Default
                    dna_prompt: castingItem.prompt
                })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || result.message || "Casting failed");

            // Success
            setCastingItem(null);
            await fetchGallery(); // Refresh UI to show status change
        } catch (e: any) {
            setError(e.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 lg:p-8 pb-32 animate-in fade-in duration-500">
            <header className="mb-8 flex flex-col gap-2">
                <h1 className="text-3xl font-serif font-bold tracking-wider text-[#E5E5E5]">My Gallery</h1>
                <div className="flex items-center gap-2">
                    <span className="bg-[#111] text-[#777] px-3 py-1 rounded text-[10px] font-mono tracking-widest uppercase border border-white/5">
                        {items.length} Assets
                    </span>
                    <span className="text-zinc-500 text-[10px] uppercase tracking-widest">1/1 Unique Supply</span>
                </div>
            </header>

            {/* RESPONSIVE GRID (Mobile: 1 col, Tablet: 2, Desktop: 3/4) */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-[9/16] bg-[#0a0a0a] rounded-2xl animate-pulse border border-white/5"></div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20 bg-[#0a0a0a] rounded-3xl border border-white/5">
                    <p className="text-zinc-500 text-sm uppercase tracking-widest">No generations yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((item) => {
                        // Determine visual URL
                        const visualUrl = item.video_url || item.url || item.image_url;
                        const isVideo = item.type === 'video' || (visualUrl && visualUrl.match(/\.(mp4|webm|mov)$/i));

                        return (
                            <div key={item.id} className="group relative bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:border-[#D4AF37]/50 transition-all duration-300">
                                {/* ASPECT RATIO LOCK (Prevents Dancing) */}
                                <div className="relative aspect-[9/16] w-full bg-black">
                                    {isVideo ? (
                                        <video
                                            src={visualUrl}
                                            className="w-full h-full object-cover"
                                            muted
                                            loop
                                            playsInline
                                            onMouseOver={e => e.currentTarget.play()}
                                            onMouseOut={e => e.currentTarget.pause()}
                                        />
                                    ) : (
                                        <img src={visualUrl} className="w-full h-full object-cover" loading="lazy" />
                                    )}

                                    {/* STATUS BADGES (ALWAYS VISIBLE) */}
                                    <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                                        {item.is_sold && (
                                            <span className="px-3 py-1 bg-red-900/80 text-white border border-red-500/50 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg backdrop-blur-md">
                                                SOLD
                                            </span>
                                        )}
                                        {item.is_for_sale && !item.is_sold && (
                                            <span className="px-3 py-1 bg-green-900/80 text-white border border-green-500/50 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg backdrop-blur-md">
                                                LISTED
                                            </span>
                                        )}
                                    </div>

                                    {/* OVERLAY ACTIONS (Desktop Hover / Mobile Touch Friendly) */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 p-4 backdrop-blur-sm">
                                        {item.is_sold ? (
                                            <div className="flex flex-col items-center text-center">
                                                <Lock className="text-red-500 mb-2" size={24} />
                                                <span className="text-red-500 font-bold text-xs uppercase tracking-widest">Asset Transferred</span>
                                            </div>
                                        ) : item.is_for_sale ? (
                                            <div className="flex flex-col items-center text-center">
                                                <Check className="text-green-500 mb-2" size={24} />
                                                <span className="text-green-500 font-bold text-xs uppercase tracking-widest">Active on Market</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setCastingItem(item)}
                                                className="px-6 py-3 bg-[#D4AF37] text-black font-bold uppercase tracking-widest rounded-full hover:bg-white transition-colors flex items-center gap-2 transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                                            >
                                                <DollarSign size={16} /> CAST (SELL)
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* MOBILE ACTION STRIP (Visible always on mobile if not sold) */}
                                <div className="p-3 border-t border-white/5 flex justify-between items-center bg-[#0a0a0a]">
                                    <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[150px]">{item.prompt}</span>
                                    {/* Mobile convenient button if needed, otherwise rely on image click/hover */}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* CASTING MODAL */}
            {castingItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-[#111] border border-white/10 rounded-[30px] p-6 w-full max-w-md relative shadow-2xl">
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-serif text-[#D4AF37] mb-2">Cast to Marketplace</h3>
                            <p className="text-zinc-500 text-xs uppercase tracking-widest">Supply: 1/1 Unique</p>
                        </div>

                        <div className="mb-8 bg-[#0a0a0a] rounded-2xl p-4 border border-white/5 flex gap-4 items-center">
                            {(castingItem.type === 'video' || castingItem.video_url || castingItem.url?.match(/\.(mp4|webm)$/)) ? (
                                <video src={castingItem.video_url || castingItem.url} className="w-16 h-24 object-cover rounded-lg bg-black" />
                            ) : (
                                <img src={castingItem.image_url || castingItem.url} className="w-16 h-24 object-cover rounded-lg bg-black" />
                            )}
                            <div>
                                <p className="text-xs text-zinc-400 line-clamp-2 mb-1">"{castingItem.prompt}"</p>
                                <span className="text-[10px] text-zinc-600 font-mono">ID: {castingItem.id.slice(0, 8)}</span>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 p-3 bg-red-900/20 border border-red-900/50 rounded-xl text-center">
                                <span className="text-red-500 text-xs font-bold flex items-center justify-center gap-2"><AlertCircle size={12} /> {error}</span>
                            </div>
                        )}

                        <div className="mb-8">
                            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-2 block text-center">Listing Price (Credits)</label>
                            <div className="relative max-w-[200px] mx-auto">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={20} />
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                    className="w-full bg-black border border-white/20 rounded-full py-3 pl-12 pr-4 text-center text-xl text-white font-mono focus:border-[#D4AF37] outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setCastingItem(null)}
                                className="flex-1 py-4 rounded-xl border border-white/10 text-zinc-400 hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCast}
                                disabled={processing}
                                className="flex-1 py-4 rounded-xl bg-[#D4AF37] text-black font-bold uppercase text-[10px] tracking-widest hover:bg-[#F2C94C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {processing ? <Loader2 size={14} className="animate-spin" /> : "Confirm Listing"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
