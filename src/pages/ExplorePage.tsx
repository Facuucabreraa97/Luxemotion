import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import { useMode } from '../context/ModeContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Loader2, Lock } from 'lucide-react';
import { S } from '../styles';

export const ExplorePage = () => {
    const { mode } = useMode();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Get handleOpenBuyModal from Outlet context
    const { handleOpenBuyModal } = useOutletContext<any>();

    const [tab, setTab] = useState<'community' | 'marketplace'>(
        searchParams.get('tab') === 'marketplace' ? 'marketplace' : 'community'
    );
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sync state with URL params
    useEffect(() => {
        const currentTab = searchParams.get('tab');
        if (currentTab === 'marketplace' || currentTab === 'community') {
            setTab(currentTab);
        }
    }, [searchParams]);

    const handleTabChange = (newTab: 'community' | 'marketplace') => {
        setTab(newTab);
        setSearchParams({ tab: newTab });
    };

    const isVideo = (url: string) => url?.match(/\.(mp4|webm|mov|mkv)$/i);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setItems([]);
        setError(null);

        const fetchItems = async () => {
            try {
                if (tab === 'community') {
                    // Fetch public generations
                    let { data, error } = await supabase
                        .from('generations')
                        .select('*, profiles(name, avatar)')
                        .eq('is_public', true)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    if (active) setItems(data || []);
                } else {
                    // Fetch marketplace talents
                    let { data, error } = await supabase
                        .from('talents')
                        .select('*')
                        .eq('for_sale', true)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    if (active) setItems(data || []);
                }
            } catch (err) {
                console.error("ExplorePage Fetch Error:", err);
                if (active) {
                    setError(tab === 'community' ? t('explore.empty.community') : t('explore.empty.marketplace'));
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchItems();
        return () => { active = false; };
    }, [tab, t]);

    const placeholders = Array(9).fill(0);

    return (
        <div className={`pt-24 px-4 md:px-6 animate-in fade-in pb-32 min-h-screen ${mode === 'velvet' ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6 md:mb-12">
                <h2 className={`text-3xl md:text-4xl font-bold uppercase tracking-[0.2em] ${mode==='velvet'?'text-white':'text-gray-900'}`}>{t('explore.title')}</h2>
                <div className={`p-1 rounded-full border flex ${mode==='velvet'?'bg-black/40 border-white/10':'bg-gray-100 border-gray-200'}`}>
                    <button onClick={()=>handleTabChange('community')} className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase transition-all ${tab==='community' ? (mode==='velvet'?'bg-[#C6A649] text-black shadow-lg':'bg-black text-white shadow-lg') : 'text-gray-400 hover:text-white'}`}>{t('explore.tabs.community')}</button>
                    <button onClick={()=>handleTabChange('marketplace')} className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase transition-all ${tab==='marketplace' ? (mode==='velvet'?'bg-[#C6A649] text-black shadow-lg':'bg-black text-white shadow-lg') : 'text-gray-400 hover:text-white'}`}>{t('explore.tabs.marketplace')}</button>
                </div>
            </div>

            {error ? (
                <div className={`p-12 rounded-3xl border text-center ${mode === 'velvet' ? 'bg-white/5 border-white/10 text-white/50' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                    <p className="uppercase tracking-widest text-xs font-bold">{error}</p>
                </div>
            ) : (
                <>
                    {items.length === 0 && !loading && tab === 'marketplace' && (
                         <div className={`p-12 rounded-3xl border text-center ${mode === 'velvet' ? 'bg-white/5 border-white/10 text-white/50' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                            <p className="uppercase tracking-widest text-xs font-bold">{t('explore.empty.marketplace')}</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {loading ? placeholders.map((_, i) => (
                            <div key={i} className={`aspect-[9/16] rounded-[30px] animate-pulse ${mode==='velvet'?'bg-white/5':'bg-gray-200'}`}></div>
                        )) : items.map((item: any) => {
                             const assetUrl = item.video_url || item.image_url;
                             const isVid = isVideo(assetUrl);
                             // Handle name display for both generations (profiles.name) and talents (name)
                             const displayName = item.profiles?.name || item.name || 'User';

                             return (
                             <div key={item.id} className={`rounded-[30px] overflow-hidden group relative hover:-translate-y-2 transition-all ${mode==='velvet'?S.panel:'bg-white shadow-lg border border-gray-100'}`}>
                                {isVid ? (
                                    <video src={assetUrl} className="aspect-[9/16] object-cover w-full" controls preload="metadata" playsInline crossOrigin="anonymous" />
                                ) : (
                                    <img src={assetUrl} className="aspect-[3/4] object-cover w-full" />
                                )}
                                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none">
                                    <p className="text-white text-[10px] font-bold uppercase tracking-widest">{displayName}</p>
                                </div>
                                <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                                    {tab === 'marketplace' ? (
                                        <>
                                            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                                                <span className="text-yellow-400 font-bold text-sm">{item.price} CR</span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleOpenBuyModal(item); }}
                                                className="bg-white text-black p-2 rounded-full hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] active:scale-95 flex items-center gap-1 px-3"
                                            >
                                                <ShoppingCart size={14} />
                                                <span className="text-[10px] font-bold uppercase">{t('explore.buy.button', { price: item.price })}</span>
                                            </button>
                                        </>
                                    ) : (
                                        // Community / Remix Logic
                                        (item.for_sale || item.is_for_sale) ? (
                                           <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg flex items-center gap-1">
                                                <Lock size={12} className="text-white/70"/>
                                                <span className="text-white/70 font-bold text-[9px] uppercase tracking-wider">Private Prompt</span>
                                           </div>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate('/app', { state: { remixPrompt: item.prompt } }); }}
                                                className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-lg flex items-center gap-2 hover:bg-white hover:text-black transition-all group"
                                            >
                                                <span className="text-lg group-hover:rotate-180 transition-transform duration-500">🌪️</span>
                                                <span className="font-bold text-[10px] uppercase tracking-wider">Remix</span>
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        )})}
                    </div>
                </>
            )}
        </div>
    );
};
