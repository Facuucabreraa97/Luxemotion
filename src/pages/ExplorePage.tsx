import React, { useState, useEffect } from 'react';
import { useMode } from '../context/ModeContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Play, User, ShoppingCart, Loader2 } from 'lucide-react';
import { useToast } from '../components/Toast';

interface ExploreItem {
  id: string;
  created_at: string;
  type: 'video' | 'model';
  is_public: boolean;
  video_url?: string;
  image_url?: string;
  prompt?: string;
  name?: string; // Model name
  price?: number;
  for_sale?: boolean;
  profiles: {
    name: string;
    avatar: string | null;
  };
}

export const ExplorePage = () => {
  const { mode } = useMode();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'models'>('all');
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/explore?type=${activeTab}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error(error);
      showToast(t('common.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const handleBuy = async (item: ExploreItem) => {
    if (!item.for_sale || !item.price) return;

    // Confirm purchase
    if (!window.confirm(t('explore.buy.confirm', { name: item.name, price: item.price }))) return;

    setPurchasing(item.id);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            showToast(t('explore.buy.login_required'), 'error');
            return;
        }

        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/marketplace/buy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ talent_id: item.id })
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error);

        showToast(t('explore.buy.success'), 'success');
        fetchItems(); // Refresh
    } catch (error: any) {
        showToast(t('explore.buy.error'), 'error');
    } finally {
        setPurchasing(null);
    }
  };

  return (
    <div className={`min-h-screen p-8 transition-colors duration-500 ${mode === 'velvet' ? 'bg-[#030303] text-white' : 'bg-gray-50 text-gray-900'}`}>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
            <h1 className={`text-3xl font-bold uppercase tracking-widest mb-2 ${mode === 'velvet' ? 'text-white' : 'text-black'}`}>
                {t('explore.title')} <span className={mode === 'velvet' ? 'text-[#C6A649]' : 'text-gray-400'}>{t('explore.suffix')}</span>
            </h1>
            <p className={`text-xs uppercase tracking-[0.2em] font-bold ${mode === 'velvet' ? 'text-gray-500' : 'text-gray-400'}`}>
                {t('explore.subtitle')}
            </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
            {['all', 'videos', 'models'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all
                        ${activeTab === tab
                            ? (mode === 'velvet' ? 'bg-[#C6A649] text-black' : 'bg-black text-white')
                            : (mode === 'velvet' ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-white text-gray-500 hover:text-black border border-gray-200')
                        }`}
                >
                    {t(`explore.tabs.${tab}`)}
                </button>
            ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
          <div className="flex justify-center items-center h-64">
              <Loader2 className={`animate-spin ${mode === 'velvet' ? 'text-[#C6A649]' : 'text-black'}`} size={32} />
          </div>
      ) : (
        <>
            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in">
                    <p className={`text-xs uppercase tracking-[0.3em] font-bold mb-4 ${mode === 'velvet' ? 'text-white/30' : 'text-gray-400'}`}>
                        {t(`explore.empty.${activeTab}`)}
                    </p>
                </div>
            ) : (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                  {items.map((item) => (
                      <div key={item.id} className={`break-inside-avoid rounded-2xl overflow-hidden relative group mb-6 border transition-all duration-300
                          ${mode === 'velvet' ? 'bg-[#0a0a0a] border-white/10 hover:border-[#C6A649]/50' : 'bg-white border-gray-100 hover:shadow-xl'}`}>

                          {/* Media */}
                          <div className="relative aspect-[9/16] bg-black">
                              {item.type === 'video' ? (
                                  <video
                                      src={item.video_url}
                                      className="w-full h-full object-cover"
                                      muted
                                      loop
                                      onMouseOver={(e) => e.currentTarget.play()}
                                      onMouseOut={(e) => e.currentTarget.pause()}
                                  />
                              ) : (
                                  <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
                              )}

                              {/* Overlay Gradient */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />

                              {/* Type Badge */}
                              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest text-white border border-white/10">
                                  {item.type}
                              </div>
                          </div>

                          {/* Info */}
                          <div className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                                      {item.profiles?.avatar ? (
                                          <img src={item.profiles.avatar} className="w-full h-full object-cover" />
                                      ) : (
                                          <div className="w-full h-full flex items-center justify-center text-xs text-white">
                                              {item.profiles?.name?.[0] || 'U'}
                                          </div>
                                      )}
                                  </div>
                                  <div>
                                      <p className={`text-xs font-bold ${mode === 'velvet' ? 'text-white' : 'text-black'}`}>
                                          {item.name || item.prompt?.slice(0, 30) + '...'}
                                      </p>
                                      <p className="text-[9px] text-gray-500 uppercase tracking-widest">
                                          {t('explore.card.by')} {item.profiles?.name || 'Unknown'}
                                      </p>
                                  </div>
                              </div>

                              {/* Action */}
                              {item.type === 'model' && item.for_sale && (
                                  <button
                                      onClick={() => handleBuy(item)}
                                      disabled={purchasing === item.id}
                                      className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                                          ${mode === 'velvet'
                                              ? 'bg-[#C6A649] text-black hover:bg-[#d4b55b]'
                                              : 'bg-black text-white hover:bg-gray-800'}`}
                                  >
                                      {purchasing === item.id ? (
                                          <Loader2 size={14} className="animate-spin" />
                                      ) : (
                                          <>
                                              <ShoppingCart size={14} />
                                              {t('explore.buy.button', { price: item.price })}
                                          </>
                                      )}
                                  </button>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
            )}
        </>
      )}
    </div>
  );
};
