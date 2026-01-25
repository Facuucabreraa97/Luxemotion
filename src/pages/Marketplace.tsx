
import React, { useEffect, useState } from 'react';
import { MarketService } from '@/services/market.service';
import { supabase } from '@/lib/supabase';
import { Asset } from '@/types';
import { Search, Filter, ShoppingBag, Sparkles } from 'lucide-react';

export const Marketplace = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        try {
            const listings = await MarketService.getAllListings();
            setAssets(listings as Asset[]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleBuy = async (asset: Asset) => {
        if (!user) return alert("Please Login to Buy");
        if (!confirm(`Buy "${asset.name}" for ${asset.price} CR?`)) return;

        try {
            await MarketService.buyAsset(asset.id, user.id);
            alert("Purchase Successful! Asset transferred to your Vault.");
            loadData(); // Refresh grid
        } catch (e: any) {
            alert("Transaction Failed: " + e.message);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-8 animate-fade-in pb-20">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div>
                    <h2 className="text-5xl font-display font-medium tracking-tight text-white mb-2">Marketplace</h2>
                    <p className="text-gray-400 font-light">Discover and collect cinematic AI assets.</p>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2 text-gray-400 focus-within:text-white transition-colors flex-1 md:w-64">
                        <Search size={18} />
                        <input type="text" placeholder="Search assets..." className="bg-transparent outline-none text-sm w-full" />
                    </div>
                    <button className="glass-panel p-2 rounded-xl text-gray-400 hover:text-white transition-colors">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    [1, 2, 3, 4].map(i => <div key={i} className="aspect-[3/4] glass-panel rounded-2xl animate-pulse bg-white/5" />)
                ) : assets.length > 0 ? (
                    assets.map(asset => (
                        <div key={asset.id} className="group glass-panel rounded-2xl overflow-hidden flex flex-col hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/10">
                            {/* MEDIA */}
                            <div className="aspect-[4/5] bg-black relative overflow-hidden">
                                {asset.image_url ? (
                                    <img src={asset.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">💠</div>
                                )}

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                                {/* Top Badge */}
                                <div className="absolute top-3 right-3 glass-panel px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                                    Series 1
                                </div>
                            </div>

                            {/* INFO */}
                            <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-display font-bold text-lg text-white truncate leading-tight">{asset.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{asset.description || 'No description provided.'}</p>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-500">Price</p>
                                        <div className="text-white font-medium flex items-center gap-1">
                                            <span className="text-lg">{asset.price}</span>
                                            <span className="text-xs text-gray-400">CR</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleBuy(asset)}
                                        className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                                    >
                                        <ShoppingBag size={14} /> Buy
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center flex flex-col items-center justify-center text-gray-500">
                        <Sparkles size={48} className="mb-4 opacity-50" />
                        <p className="text-lg font-light">The market is empty.</p>
                        <p className="text-sm">Be the first to list a creation.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
