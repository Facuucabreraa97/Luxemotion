// src/pages/Marketplace.tsx
// Enhanced Marketplace with Discovery: Categories, Search, Likes, Trending
// v2 — Fixes: view tracking, centered media, mobile responsive
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MarketService } from '@/services/market.service';
import { LazyVideo } from '@/components/LazyVideo';
import { useTranslation } from '@/context/LanguageContext';
import {
  Search, Heart, Eye, TrendingUp, Clock, ArrowUpDown,
  ShoppingBag, ChevronDown, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ────────────────────────────────────────────────────
interface MarketAsset {
  id: string;
  name: string;
  description: string;
  image_url: string;
  video_url: string;
  price: number;
  category: string;
  tags: string[];
  likes_count: number;
  views_count: number;
  trending_score: number;
  sales_count: number;
  created_at: string;
  creator_email?: string;
}

// ── Categories ───────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'tech', label: 'Tech' },
  { id: 'food', label: 'Food' },
  { id: 'travel', label: 'Travel' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'music', label: 'Music' },
  { id: 'art', label: 'Art' },
  { id: 'business', label: 'Business' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'other', label: 'Other' },
];

const SORT_OPTIONS = [
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'popular', label: 'Most Liked', icon: Heart },
  { id: 'newest', label: 'Newest', icon: Clock },
  { id: 'price_low', label: 'Price: Low to High', icon: ArrowUpDown },
  { id: 'price_high', label: 'Price: High to Low', icon: ArrowUpDown },
];

// ── View Tracker Hook ────────────────────────────────────────
const useViewTracker = (assetId: string, userId: string | null) => {
  const ref = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    if (!userId || tracked.current || !ref.current) return;
    const el = ref.current;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !tracked.current) {
          timer = setTimeout(async () => {
            tracked.current = true;
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return;
              await fetch('/api/marketplace', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ action: 'view', talent_id: assetId }),
              });
            } catch { /* silent */ }
          }, 1000);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => { observer.disconnect(); if (timer) clearTimeout(timer); };
  }, [assetId, userId]);

  return ref;
};

// ── Asset Card ───────────────────────────────────────────────
const AssetCard: React.FC<{
  asset: MarketAsset;
  isLiked: boolean;
  userId: string | null;
  onLike: (id: string) => void;
  onBuy: (asset: MarketAsset) => void;
  t: (key: string) => string;
}> = ({ asset, isLiked, userId, onLike, onBuy, t }) => {
  const viewRef = useViewTracker(asset.id, userId);
  const isVideo = !!asset.video_url && !asset.video_url.includes('placeholder');

  return (
    <div ref={viewRef} className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/15 transition-all duration-300 flex flex-col">
      {/* Media — square aspect for consistent grid */}
      <div className="relative aspect-square overflow-hidden bg-black/40">
        {isVideo ? (
          <LazyVideo src={asset.video_url} poster={asset.image_url} className="w-full h-full object-cover" />
        ) : (
          <img
            src={asset.image_url}
            alt={asset.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" fill="%23111"><rect width="400" height="400"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23333" font-size="14">No preview</text></svg>'; }}
          />
        )}
        {asset.category && asset.category !== 'other' && (
          <span className="absolute top-3 left-3 bg-black/50 backdrop-blur-md text-white/90 text-[11px] font-medium px-2.5 py-1 rounded-full capitalize">{asset.category}</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onLike(asset.id); }}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all ${isLiked ? 'bg-red-500/30 backdrop-blur-md text-red-400' : 'bg-black/30 backdrop-blur-md text-white/50 hover:text-white'}`}
        >
          <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8">
          <div className="flex items-center gap-3 text-[11px] text-white/60">
            <span className="flex items-center gap-1"><Heart size={11} /> {asset.likes_count || 0}</span>
            <span className="flex items-center gap-1"><Eye size={11} /> {asset.views_count || 0}</span>
            {(asset.sales_count || 0) > 0 && <span className="flex items-center gap-1"><ShoppingBag size={11} /> {asset.sales_count}</span>}
          </div>
        </div>
      </div>
      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        <h3 className="text-white font-medium text-xs sm:text-sm truncate">{asset.name || 'Untitled'}</h3>
        <p className="text-gray-500 text-[11px] sm:text-xs mt-0.5 line-clamp-1">{asset.description || t('marketplace.noDescription')}</p>
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {asset.tags.slice(0, 3).map(tag => (
              <span key={tag} className="bg-white/[0.04] text-gray-500 text-[10px] px-2 py-0.5 rounded-full border border-white/[0.06]">#{tag}</span>
            ))}
          </div>
        )}
        <div className="flex-1" />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
          <span className="text-blue-400 font-bold text-xs sm:text-sm">{asset.price} CR</span>
          <button onClick={() => onBuy(asset)} className="px-3 sm:px-4 py-1.5 bg-blue-500/15 text-blue-400 text-[11px] sm:text-xs font-semibold rounded-lg hover:bg-blue-500/25 active:scale-95 transition-all">
            {t('marketplace.buy')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────
export const Marketplace: React.FC = () => {
  const { t } = useTranslation();
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;
  const catScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { supabase.auth.getSession().then(({ data: { session } }) => { setUserId(session?.user?.id || null); }); }, []);

  const fetchMarketplace = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      params.set('sort', sortBy);
      params.set('limit', String(LIMIT));
      params.set('offset', String(offset));
      const headers: Record<string, string> = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
      const response = await fetch(`/api/marketplace?${params.toString()}`, { headers });
      if (!response.ok) {
        const { data } = await supabase.from('talents').select('*').eq('for_sale', true).order('created_at', { ascending: false });
        setAssets((data || []) as unknown as MarketAsset[]);
        setTotal((data || []).length);
        return;
      }
      const result = await response.json();
      setAssets(result.results || []);
      setTotal(result.total || 0);
      setUserLikes(result.user_likes || []);
    } catch (err) {
      console.error('Marketplace fetch error:', err);
      const listings = await MarketService.getAllListings();
      setAssets(listings as unknown as MarketAsset[]);
      setTotal(listings.length);
    } finally { setLoading(false); }
  }, [category, searchQuery, sortBy, offset]);

  useEffect(() => { const timer = setTimeout(() => fetchMarketplace(), searchQuery ? 300 : 0); return () => clearTimeout(timer); }, [fetchMarketplace]);
  useEffect(() => { setOffset(0); }, [category, searchQuery, sortBy]);

  const handleLike = async (assetId: string) => {
    if (!userId) { toast.error(t('marketplace.loginRequired')); return; }
    const wasLiked = userLikes.includes(assetId);
    setUserLikes(prev => wasLiked ? prev.filter(id => id !== assetId) : [...prev, assetId]);
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, likes_count: (a.likes_count || 0) + (wasLiked ? -1 : 1) } : a));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/marketplace', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }, body: JSON.stringify({ action: 'like', talent_id: assetId }) });
      if (!res.ok) throw new Error();
    } catch {
      setUserLikes(prev => wasLiked ? [...prev, assetId] : prev.filter(id => id !== assetId));
      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, likes_count: (a.likes_count || 0) + (wasLiked ? 1 : -1) } : a));
    }
  };

  const handleBuy = async (asset: MarketAsset) => {
    if (!userId) { toast.error(t('marketplace.loginRequired')); return; }
    if (!window.confirm(t('marketplace.confirmBuy').replace('{name}', asset.name).replace('{price}', String(asset.price)))) return;
    try { await MarketService.buyAsset(asset.id, userId); toast.success(t('marketplace.purchaseSuccess')); fetchMarketplace(); }
    catch (err: any) { toast.error(err.message || t('marketplace.transactionFailed')); }
  };

  const scrollCats = (dir: 'left' | 'right') => { catScrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' }); };
  const currentSort = SORT_OPTIONS.find(s => s.id === sortBy) || SORT_OPTIONS[0];

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{t('marketplace.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('marketplace.subtitle')}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={17} />
          <input type="text" placeholder={t('marketplace.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/40 transition-all" />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white p-1"><X size={14} /></button>}
        </div>
        <div className="relative">
          <button onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-gray-400 hover:text-white transition-all w-full sm:min-w-[180px]">
            <currentSort.icon size={15} /><span className="text-sm">{currentSort.label}</span><ChevronDown size={13} className={`ml-auto transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showSortDropdown && (<>
            <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
            <div className="absolute right-0 top-full mt-1.5 bg-[#141414] border border-white/10 rounded-xl overflow-hidden z-20 min-w-[180px] shadow-2xl">
              {SORT_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => { setSortBy(opt.id); setShowSortDropdown(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition ${sortBy === opt.id ? 'bg-blue-500/15 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <opt.icon size={14} />{opt.label}
                </button>
              ))}
            </div>
          </>)}
        </div>
      </div>

      <div className="relative mb-6">
        <button onClick={() => scrollCats('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center text-gray-400 hover:text-white border border-white/10 hidden sm:flex"><ChevronLeft size={14} /></button>
        <div ref={catScrollRef} className="flex gap-2 overflow-x-auto px-1 py-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${category === cat.id ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/[0.03] text-gray-500 border border-white/[0.06] hover:text-gray-300'}`}>
              {cat.label}
            </button>
          ))}
        </div>
        <button onClick={() => scrollCats('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center text-gray-400 hover:text-white border border-white/10 hidden sm:flex"><ChevronRight size={14} /></button>
      </div>

      <p className="text-xs text-gray-600 mb-4">{total} asset{total !== 1 ? 's' : ''} found{category !== 'all' && ` in ${CATEGORIES.find(c => c.id === category)?.label}`}</p>

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (<div key={i} className="bg-white/[0.03] rounded-2xl overflow-hidden"><div className="aspect-square bg-white/[0.02] animate-pulse" /><div className="p-4 space-y-2"><div className="h-4 bg-white/[0.04] rounded animate-pulse w-3/4" /><div className="h-3 bg-white/[0.03] rounded animate-pulse w-1/2" /></div></div>))}
        </div>
      )}

      {!loading && assets.length === 0 && (
        <div className="text-center py-20">
          <ShoppingBag className="mx-auto text-gray-700 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-400">{t('marketplace.emptyTitle')}</h3>
          <p className="text-gray-600 text-sm mt-1">{t('marketplace.emptySubtitle')}</p>
        </div>
      )}

      {!loading && assets.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {assets.map(asset => (
            <AssetCard key={asset.id} asset={asset} isLiked={userLikes.includes(asset.id)} userId={userId} onLike={handleLike} onBuy={handleBuy} t={t} />
          ))}
        </div>
      )}

      {total > LIMIT && (
        <div className="flex justify-center items-center gap-3 mt-8 pb-4">
          <button onClick={() => setOffset(Math.max(0, offset - LIMIT))} disabled={offset === 0} className="px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-gray-400 text-sm hover:text-white disabled:opacity-30 transition">Previous</button>
          <span className="text-gray-600 text-sm">{Math.floor(offset / LIMIT) + 1} / {Math.ceil(total / LIMIT)}</span>
          <button onClick={() => setOffset(offset + LIMIT)} disabled={offset + LIMIT >= total} className="px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-gray-400 text-sm hover:text-white disabled:opacity-30 transition">Next</button>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
