import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MarketService } from '@/services/market.service';
import { Asset } from '@/types';
import { DailyQuests } from '@/modules/gamification/DailyQuests';
import { AchievementsGrid } from '@/modules/gamification/AchievementsGrid';
import { User } from '@supabase/supabase-js';

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  type: string;
  user_id: string;
}

const Profile = () => {
  const [activeTab, setActiveTab] = useState<
    'created' | 'drafts' | 'collected' | 'wallet' | 'missions'
  >('created');
  const [user, setUser] = useState<User | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    setUser(session.user); // En un caso real, haríamos UserService.getProfile(session.user.id)

    // Cargar Assets reales
    try {
      const [myAssets, myTx] = await Promise.all([
        MarketService.getMyAssets(session.user.id),
        MarketService.getTransactions(session.user.id),
      ]);
      setAssets(myAssets);
      setTransactions(myTx);
    } catch (e) {
      console.error('Error loading profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async (asset: Asset) => {
    if (!user) return alert('Please log in to mint assets');
    const priceStr = prompt(`Set listing price(CR) for "${asset.name}": `, '100');
    if (!priceStr) return;
    const price = Number(priceStr);
    if (isNaN(price) || price < 0) return alert('Invalid price');

    try {
      await MarketService.finalizeMint(asset.id, price);
      alert('Asset Minted & Listed!');
      loadProfileData();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      alert('Minting Failed: ' + message);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    if (activeTab === 'drafts') return asset.is_draft;
    if (activeTab === 'created') return !asset.is_draft && asset.creator_id === user?.id;
    if (activeTab === 'collected')
      return !asset.is_draft && asset.owner_id === user?.id && asset.creator_id !== user?.id; // Simple logic
    return false;
  });

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
            <div
              className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full border-4 border-black"
              title="Verificado"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
              </svg>
            </div>
          </div>

          <div className="flex-1 pt-2 md:pt-24">
            <h1 className="text-4xl font-bold text-white tracking-tight">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Creator'}
            </h1>
            <div className="flex items-center gap-3 text-gray-400 text-sm mt-2 font-mono bg-white/5 w-fit px-3 py-1 rounded-full border border-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                {user?.id?.substring(0, 8)}...{user?.id?.substring(user.id.length - 4)}
              </span>
            </div>
          </div>
        </div>
        // ... (inside return)
        {/* TABS */}
        <div className="mt-16 border-b border-white/10 flex gap-8 overflow-x-auto">
          {['created', 'drafts', 'collected', 'wallet', 'missions'].map((tab) => (
            <button
              key={tab}
              onClick={() =>
                setActiveTab(tab as 'created' | 'drafts' | 'collected' | 'wallet' | 'missions')
              }
              className={`pb-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              } `}
            >
              {tab}{' '}
              {tab === 'drafts' && assets.filter((a) => a.is_draft).length > 0 && (
                <span className="ml-1 bg-white text-black px-1.5 rounded text-[10px]">
                  {assets.filter((a) => a.is_draft).length}
                </span>
              )}
            </button>
          ))}
        </div>
        {/* GRID OR WALLET LIST */}
        <div className="mt-8">
          {loading ? (
            <div className="text-gray-500 col-span-full py-20 text-center animate-pulse">
              Checking Vault...
            </div>
          ) : activeTab === 'missions' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div>
                <DailyQuests />
              </div>
              <div className="lg:col-span-2">
                <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider mb-2">
                  Achievements
                </h3>
                <AchievementsGrid />
              </div>
            </div>
          ) : activeTab === 'wallet' ? (
            <div className="glass-panel rounded-2xl overflow-hidden p-6 border border-white/10">
              <h3 className="text-xl font-display font-medium mb-6 text-white">
                Transaction History
              </h3>
              <div className="space-y-4">
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p - 3 rounded - full ${tx.amount > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'} `}
                        >
                          {tx.amount > 0 ? '↓' : '↑'}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{tx.type}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`font - mono font - bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-white'} `}
                      >
                        {tx.amount > 0 ? '+' : ''}
                        {tx.amount} CR
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-center py-10">No transactions yet.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer"
                  >
                    <div
                      className="aspect-square bg-gray-900 relative overflow-hidden"
                      onClick={() => (asset.video_url || asset.image_url) && setSelectedAsset(asset)}
                    >
                      {asset.video_url ? (
                        <>
                          <video
                            src={asset.video_url}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            autoPlay
                            muted
                            loop
                          />
                          {/* Play icon overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                              <svg
                                className="w-8 h-8 text-white ml-1"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </>
                      ) : asset.image_url ? (
                        <>
                          <img
                            src={asset.image_url}
                            alt={asset.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {/* Expand icon overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                              <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                              </svg>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          🎬
                        </div>
                      )}

                      {asset.is_draft && (
                        <div className="absolute top-2 left-2 bg-yellow-500/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-black border border-white/10 uppercase tracking-wider">
                          Draft
                        </div>
                      )}

                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10">
                        1/{asset.supply_total}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white truncate">{asset.name}</h3>
                      <div className="flex justify-between items-end mt-4">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Price</p>
                          <p className="text-sm font-bold text-white">
                            {asset.price > 0 ? `${asset.price} CR` : 'Not Listed'}
                          </p>
                        </div>
                        {asset.is_draft && (
                          <button
                            onClick={() => handleMint(asset)}
                            className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold hover:bg-emerald-400 transition"
                          >
                            Mint Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                  <p className="text-gray-400 mb-4">No assets found in {activeTab}.</p>
                  <a
                    href="/app/studio"
                    className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition"
                  >
                    Go to Studio
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media Modal - Responsive for Mobile & Desktop */}
      {selectedAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-8"
          onClick={() => setSelectedAsset(null)}
        >
          {/* Close button - Mobile top-right, Desktop above content */}
          <button
            onClick={() => setSelectedAsset(null)}
            className="absolute top-4 right-4 md:top-8 md:right-8 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div
            className="relative w-full max-w-5xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Media container - Responsive sizing */}
            <div className="flex-1 flex items-center justify-center rounded-2xl overflow-hidden bg-black shadow-2xl">
              {selectedAsset.video_url ? (
                <video
                  src={selectedAsset.video_url}
                  className="w-full h-full max-h-[70vh] md:max-h-[75vh] object-contain"
                  controls
                  autoPlay
                  loop
                  playsInline
                />
              ) : selectedAsset.image_url ? (
                <img
                  src={selectedAsset.image_url}
                  alt={selectedAsset.name}
                  className="w-full h-full max-h-[70vh] md:max-h-[75vh] object-contain"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-6xl">🎬</div>
              )}
            </div>

            {/* Info section - Always visible */}
            <div className="mt-4 text-center px-4">
              <h3 className="text-lg md:text-xl font-bold text-white truncate">{selectedAsset.name}</h3>
              {selectedAsset.description && (
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{selectedAsset.description}</p>
              )}
              
              {/* Action buttons for mobile */}
              <div className="flex justify-center gap-3 mt-4">
                {selectedAsset.video_url && (
                  <a
                    href={selectedAsset.video_url}
                    download
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium text-white transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Download
                  </a>
                )}
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors md:hidden"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Profile;
