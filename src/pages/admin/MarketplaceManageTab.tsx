// src/pages/admin/MarketplaceManageTab.tsx
// Admin: Manage asset categories, tags, and feature assets
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Tag, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'fashion', 'beauty', 'fitness', 'tech', 'food', 'travel',
  'lifestyle', 'gaming', 'music', 'art', 'business', 'education',
  'entertainment', 'sports', 'other'
];

interface AssetRow {
  id: string;
  name: string;
  category: string;
  tags: string[];
  for_sale: boolean;
  price: number;
  likes_count: number;
  views_count: number;
  trending_score: number;
}

export const MarketplaceManageTab: React.FC = () => {
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editTags, setEditTags] = useState<Record<string, string>>({});

  const fetchAssets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('talents')
      .select('id, name, category, tags, for_sale, price, likes_count, views_count, trending_score')
      .order('created_at', { ascending: false });
    setAssets((data || []) as AssetRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchAssets(); }, []);

  const updateCategory = async (id: string, newCategory: string) => {
    setSaving(id);
    const { error } = await supabase
      .from('talents')
      .update({ category: newCategory })
      .eq('id', id);
    if (error) {
      toast.error('Failed to update category');
    } else {
      toast.success('Category updated');
      setAssets(prev => prev.map(a => a.id === id ? { ...a, category: newCategory } : a));
    }
    setSaving(null);
  };

  const updateTags = async (id: string) => {
    const rawTags = editTags[id];
    if (rawTags === undefined) return;

    const tags = rawTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    setSaving(id);
    const { error } = await supabase
      .from('talents')
      .update({ tags })
      .eq('id', id);
    if (error) {
      toast.error('Failed to update tags');
    } else {
      toast.success(`Tags updated (${tags.length})`);
      setAssets(prev => prev.map(a => a.id === id ? { ...a, tags } : a));
      setEditTags(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
    setSaving(null);
  };

  const recalcTrending = async () => {
    setLoading(true);
    const { error } = await supabase.rpc('calculate_trending_scores');
    if (error) {
      toast.error('Failed: ' + error.message);
    } else {
      toast.success('Trending scores recalculated');
      fetchAssets();
    }
  };

  if (loading && assets.length === 0) {
    return <div className="text-center text-gray-500 py-10">Loading assets...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Marketplace Manager</h3>
        <button
          onClick={recalcTrending}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-gray-400 hover:text-white text-sm"
        >
          <RefreshCw size={14} /> Recalc Trending
        </button>
      </div>

      <div className="bg-[#111] rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-white/5">
              <th className="text-left p-3">Asset</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Tags</th>
              <th className="text-right p-3">Score</th>
              <th className="text-right p-3">Likes</th>
              <th className="text-right p-3">Views</th>
              <th className="text-center p-3">Listed</th>
            </tr>
          </thead>
          <tbody>
            {assets.map(asset => (
              <tr key={asset.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-3 text-gray-300 max-w-[150px] truncate">{asset.name}</td>
                <td className="p-3">
                  <select
                    value={asset.category || 'other'}
                    onChange={(e) => updateCategory(asset.id, e.target.value)}
                    disabled={saving === asset.id}
                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c} className="bg-[#111]">{c}</option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="tag1, tag2, tag3"
                      value={editTags[asset.id] !== undefined ? editTags[asset.id] : (asset.tags || []).join(', ')}
                      onChange={(e) => setEditTags(prev => ({ ...prev, [asset.id]: e.target.value }))}
                      className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs w-32"
                    />
                    {editTags[asset.id] !== undefined && (
                      <button
                        onClick={() => updateTags(asset.id)}
                        disabled={saving === asset.id}
                        className="p-1 bg-blue-500/20 rounded text-blue-400 hover:bg-blue-500/30"
                      >
                        <Save size={12} />
                      </button>
                    )}
                  </div>
                </td>
                <td className="p-3 text-right text-gray-400 font-mono text-xs">
                  {(asset.trending_score || 0).toFixed(1)}
                </td>
                <td className="p-3 text-right text-gray-400">{asset.likes_count || 0}</td>
                <td className="p-3 text-right text-gray-400">{asset.views_count || 0}</td>
                <td className="p-3 text-center">
                  {asset.for_sale ? (
                    <span className="text-emerald-400 text-xs font-medium">{asset.price} CR</span>
                  ) : (
                    <span className="text-gray-600 text-xs">Draft</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketplaceManageTab;
