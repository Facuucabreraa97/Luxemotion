import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MarketService } from '@/services/market.service';
import { Asset } from '@/types';

const Profile = () => {
    const [activeTab, setActiveTab] = useState<'created' | 'collected' | 'activity'>('created');
    const [user, setUser] = useState<any>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfileData();
    }, []);

    const loadProfileData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        setUser(session.user); // En un caso real, haríamos UserService.getProfile(session.user.id)

        // Cargar Assets reales
        try {
            const myAssets = await MarketService.getMyAssets(session.user.id);
            setAssets(myAssets);
        } catch (e) {
            console.error("Error cargando assets:", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black pb-20 font-sans">
            {/* BANNER HEADER (Static por ahora, dinámico pronto) */}
            <div className="h-60 md:h-80 w-full relative group bg-gradient-to-r from-gray-900 to-black">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070')] bg-cover bg-center opacity-40 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            </div>

            {/* PROFILE INFO */}
            <div className="max-w-7xl mx-auto px-6 -mt-24 relative z-10">
                <div className="flex flex-col md:flex-row gap-8 items-end md:items-start">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl border-4 border-black bg-gray-800 overflow-hidden shadow-2xl relative">
                            {/* Fallback visual para avatar */}
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold">
                                {user?.email?.[0].toUpperCase() || '?'}
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full border-4 border-black" title="Verificado">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                        </div>
                    </div>

                    <div className="flex-1 pt-2 md:pt-24">
                        <h1 className="text-4xl font-bold text-white tracking-tight">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Creator'}</h1>
                        <div className="flex items-center gap-3 text-gray-400 text-sm mt-2 font-mono bg-white/5 w-fit px-3 py-1 rounded-full border border-white/5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>{user?.id?.substring(0, 8)}...{user?.id?.substring(user.id.length - 4)}</span>
                        </div>
                    </div>
                </div>

                {/* TABS */}
                <div className="mt-16 border-b border-white/10 flex gap-8">
                    {['created', 'collected', 'activity'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* GRID DE ACTIVOS REALES */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {loading ? (
                        <div className="text-gray-500 col-span-full py-20 text-center animate-pulse">Cargando la blockchain...</div>
                    ) : assets.length > 0 ? (
                        assets.map(asset => (
                            <div key={asset.id} className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer">
                                <div className="aspect-square bg-gray-900 relative overflow-hidden">
                                    {/* Placeholder o Imagen Real */}
                                    {asset.image_url ? (
                                        <img src={asset.image_url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl">🎬</div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10">
                                        1/{asset.supply_total}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-white truncate">{asset.name}</h3>
                                    <div className="flex justify-between items-end mt-4">
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Precio</p>
                                            <p className="text-sm font-bold text-white">{asset.price > 0 ? `${asset.price} CR` : 'No listado'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                            <p className="text-gray-400 mb-4">Aún no has creado ningún influencer.</p>
                            <a href="/app" className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition">Ir al Studio</a>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};
export default Profile;
