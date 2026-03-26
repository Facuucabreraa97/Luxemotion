import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import { useMode } from '../context/ModeContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Loader2, Lock, ArrowUpDown, User, Play, Film, Image as ImageIcon } from 'lucide-react';
import { S } from '../styles';
import { useToast } from '../components/Toast';

type MainTab = 'community' | 'marketplace';
type TypeFilter = 'all' | 'videos' | 'models';
type SortOption = 'recent' | 'price_asc' | 'price_desc';

export const ExplorePage = () => {
    const { mode } = useMode();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    const { handleOpenBuyModal } = useOutletContext<any>();

    const [tab, setTab] = useState<MainTab>(
        searchParams.get('tab') === 'marketplace' ? 'marketplace' : 'community'
    );
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentTab = searchParams.get('tab');
        if (currentTab === 'marketplace' || currentTab === 'community') {
            setTab(currentTab);
        }
    }, [searchParams]);

    const handleTabChange = (newTab: MainTab) => {
        setTab(newTab);
        setTypeFilter('all');
        setSortBy('recent');
        setSearchParams({ tab: newTab });
    };

    const isVideo = (url: string) => url?.match(/\.(mp4|webm|mov|mkv)$/i);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setItems([]);

        const fetchItems = async () => {
            try {
                if (tab === 'community') {
                    let { data, error } = await supabase
                        .from('generations')
                        .select('*, profiles(name, avatar)')
                        .eq('is_public', true)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    if (active) setItems(data || []);
                } else {
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
                    showToast(tab === 'community' ? t('explore.empty.community') : t('explore.empty.marketplace'), 'error');
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchItems();
        return () => { active = false; };
    }, [tab]);

    const filteredItems = items.filter(item => {
        if (typeFilter === 'all') return true;
        const assetUrl = item.video_url || item.image_url;
        const itemIsVideo = isVideo(assetUrl);
        if (typeFilter === 'videos') return itemIsVideo;
        if (typeFilter === 'models') return !itemIsVideo;
        return true;
    });

    const sortedItems = [...filteredItems].sort((a, b) => {
        if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const placeholders = Array(9).fill(0);

    const tabBtn = (label: string, isActive: boolean, onClick: () => void) => (
        <button onClick={onClick} className={`px-5 py-2 rounded-full text-[9px] font-bold uppercase transition-all ${isActive ? (mode === 'velvet' ? 'bg-[#C6A649] text-black shadow-lg' : 'bg-black text-white shadow-lg') : (mode === 'velvet' ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-black')}`}>{label}</button>
    );

    const getTypeBadge = (item: any) => {
        const assetUrl = item.video_url || item.image_url;
        const itemIsVideo = isVideo(assetUrl);
        return (
            <div className={`absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 ${itemIsVideo ? 'bg-purple-500/80 text-white backdrop-blur-sm' : 'bg-blue-500/80 text-white backdrop-blur-sm'}`}>
                {itemIsVideo ? <><Film size={10} /> Video</> : <><ImageIcon size={10} /> Model</>}
            </div>
        );
    };

    const emptyKey = tab === 'community'
        ? (typeFilter === 'all' ? 'explore.empty.community' : typeFilter === 'videos' ? 'explore.empty.videos' : 'explore.empty.models')
        : (typeFilter === 'all' ? 'explore.empty.marketplace' : typeFilter === 'videos' ? 'explore.empty.videos' : 'explore.empty.models');

    return (
        <div className={`pt-24 px-4 md:px-6 animate-in fade-in pb-32 min-h-screen ${mode === 'velvet' ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>
            {/* Header */}
            <div className="flex flex-col gap-4 mb-6 md:mb-10">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <h2 className={`text-3xl md:text-4xl font-bold uppercase tracking-[0.2em] ${mode === 'velvet' ? 'text-white' : 'text-gray-900'}`}>{t('explore.title')}</h2>
                    <div className={`p-1 rounded-full border flex ${mode === 'velvet' ? 'bg-black/40 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                        {tabBtn(t('explore.tabs.community'), tab === 'community', () => handleTabChange('community'))}
                        {tabBtn(t('explore.tabs.marketplace'), tab === 'marketplace', () => handleTabChange('marketplace'))}
                    </div>
                </div>

                {/* Type filter + Sort */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="flex gap-2">
                        {tabBtn(t('explore.tabs.all'), typeFilter === 'all', () => setTypeFilter('all'))}
                        {tabBtn(t('explore.tabs.videos'), typeFilter === 'videos', () => setTypeFilter('videos'))}
                        {tabBtn(t('explore.tabs.models'), typeFilter === 'models', () => setTypeFilter('models'))}
                    </div>
                    {tab === 'marketplace' && (
                        <div className={`flex gap-2 items-center p-1 rounded-full border ${mode === 'velvet' ? 'bg-black/40 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                            <ArrowUpDown size={12} className="ml-2 opacity-40" />
                            <button onClick={() => setSortBy('recent')} className={`px-3 py-1.5 rounded-full text-[8px] font-bold uppercase transition-all ${sortBy === 'recent' ? (mode === 'velvet' ? 'bg-[#C6A649] text-black' : 'bg-black text-white') : 'text-gray-400'}`}>Reciente</button>
                            <button onClick={() => setSortBy('price_asc')} className={`px-3 py-1.5 rounded-full text-[8px] font-bold uppercase transition-all ${sortBy === 'price_asc' ? (mode === 'velvet' ? 'bg-[#C6A649] text-black' : 'bg-black text-white') : 'text-gray-400'}`}>Precio ↑</button>
                            <button onClick={() => setSortBy('price_desc')} className={`px-3 py-1.5 rounded-full text-[8px] font-bold uppercase transition-all ${sortBy === 'price_desc' ? (mode === 'velvet' ? 'bg-[#C6A649] text-black' : 'bg-black text-white') : 'text-gray-400'}`}>Precio ↓</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Results count */}
            {!loading && sortedItems.length > 0 && (
                <p className={`text-[10px] uppercase tracking-widest mb-6 ${mode === 'velvet' ? 'text-white/30' : 'text-gray-400'}`}>
                    {sortedItems.length} {sortedItems.length === 1 ? 'resultado' : 'resultados'}
                </p>
            )}

            {/* Empty state */}
            {sortedItems.length === 0 && !loading && (
                <div className={`p-12 rounded-3xl border text-center ${mode === 'velvet' ? 'bg-white/5 border-white/10 text-white/50' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                    <p className="uppercase tracking-widest text-xs font-bold">{t(emptyKey)}</p>
                </div>
            )}

            {/* Grid */}
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {loading ? placeholders.map((_, i) => (
                    <div key={i} className={`aspect-[9/16] rounded-[30px] animate-pulse break-inside-avoid ${mode === 'velvet' ? 'bg-white/5' : 'bg-gray-200'}`}></div>
                )) : sortedItems.map((item: any) => {
                    const assetUrl = item.video_url || item.image_url;
                    const isVid = isVideo(assetUrl);
                    const displayName = item.profiles?.name || item.name || 'User';
                    const avatarUrl = item.profiles?.avatar;

                    return (
                        <div key={item.id} className={`rounded-[30px] overflow-hidden group relative hover:-translate-y-1 transition-all duration-300 break-inside-avoid ${mode === 'velvet' ? S.panel : 'bg-white shadow-lg border border-gray-100'}`}>
                            {getTypeBadge(item)}
                            {isVid ? (
                                <video src={assetUrl} className="aspect-[9/16] object-cover w-full" controls preload="metadata" playsInline crossOrigin="anonymous" />
                            ) : (
                                <img src={assetUrl} className="aspect-[3/4] object-cover w-full" loading="lazy" />
                            )}
                            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none">
                                <div className="flex items-center gap-2">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} className="w-5 h-5 rounded-full object-cover border border-white/20" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center"><User size={10} className="text-white/60" /></div>
                                    )}
                                    <p className="text-white text-[10px] font-bold uppercase tracking-widest">{displayName}</p>
                                </div>
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
                                    (item.for_sale || item.is_for_sale) ? (
                                        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg flex items-center gap-1">
                                            <Lock size={12} className="text-white/70" />
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
                    );
                })}
            </div>
        </div>
    );
};
