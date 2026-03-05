import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Search, RefreshCw, Plus, Trash2 } from 'lucide-react';

interface TranslationRow {
  translation_key: string;
  value_en: string;
  value_es: string;
}

export const TranslationsTab = () => {
  const [rows, setRows] = useState<TranslationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [dirty, setDirty] = useState<Set<string>>(new Set());

  // New key form
  const [showNew, setShowNew] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newEn, setNewEn] = useState('');
  const [newEs, setNewEs] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('site_translations')
      .select('translation_key, value_en, value_es')
      .order('translation_key', { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setRows(data || []);
      setDirty(new Set());
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── Grouped by prefix ──
  const grouped = useMemo(() => {
    const filtered = rows.filter(r =>
      r.translation_key.toLowerCase().includes(search.toLowerCase()) ||
      r.value_en.toLowerCase().includes(search.toLowerCase()) ||
      r.value_es.toLowerCase().includes(search.toLowerCase())
    );

    const groups: Record<string, TranslationRow[]> = {};
    for (const row of filtered) {
      const prefix = row.translation_key.split('.')[0] || 'other';
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(row);
    }
    return groups;
  }, [rows, search]);

  const handleChange = (key: string, field: 'value_en' | 'value_es', value: string) => {
    setRows(prev => prev.map(r =>
      r.translation_key === key ? { ...r, [field]: value } : r
    ));
    setDirty(prev => new Set(prev).add(key));
  };

  const handleSaveAll = async () => {
    if (dirty.size === 0) { showToast('No changes to save'); return; }

    setSaving(true);
    try {
      const toUpsert = rows.filter(r => dirty.has(r.translation_key));

      // Atomic upsert
      const { error } = await supabase
        .from('site_translations')
        .upsert(toUpsert, { onConflict: 'translation_key' });

      if (error) throw error;

      // Bump i18n_version so client caches invalidate
      const { error: versionErr } = await supabase
        .from('i18n_version')
        .update({ version: Date.now() })
        .eq('id', 1);

      if (versionErr) {
        console.warn('[TranslationsTab] Failed to bump i18n_version:', versionErr.message);
      }

      setDirty(new Set());
      showToast(`✓ Saved ${toUpsert.length} translation(s)`);
    } catch (e) {
      showToast('Error saving translations');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddKey = async () => {
    const key = newKey.trim().toLowerCase().replace(/\s+/g, '.');
    if (!key) return;

    // Validate symmetry
    if (!newEn.trim() || !newEs.trim()) {
      showToast('Both EN and ES values are required (symmetry rule)');
      return;
    }

    // Check duplicate
    if (rows.some(r => r.translation_key === key)) {
      showToast('Key already exists');
      return;
    }

    const { error } = await supabase
      .from('site_translations')
      .insert([{ translation_key: key, value_en: newEn.trim(), value_es: newEs.trim() }]);

    if (error) {
      showToast('Error adding key');
      console.error(error);
      return;
    }

    setNewKey('');
    setNewEn('');
    setNewEs('');
    setShowNew(false);
    showToast(`✓ Key "${key}" added`);
    loadAll();
  };

  const handleDelete = async (key: string) => {
    if (!window.confirm(`Delete "${key}"? This cannot be undone.`)) return;

    const { error } = await supabase
      .from('site_translations')
      .delete()
      .eq('translation_key', key);

    if (error) {
      showToast('Error deleting key');
      return;
    }

    showToast(`Deleted "${key}"`);
    loadAll();
  };

  if (loading) {
    return <div className="text-gray-500 animate-pulse text-center py-16">Loading translations...</div>;
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 bg-emerald-500 text-black font-bold px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Translations CMS</h2>
          <p className="text-xs text-gray-500 mt-1">
            {rows.length} keys · {dirty.size} unsaved change{dirty.size !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNew(!showNew)}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 text-gray-300 border border-white/10 rounded-lg hover:bg-white/10 transition text-xs font-bold"
          >
            <Plus size={14} /> Add Key
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving || dirty.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition text-sm disabled:opacity-50"
          >
            <Save size={14} /> {saving ? 'Saving...' : `Save (${dirty.size})`}
          </button>
          <button onClick={loadAll} className="p-2 hover:bg-white/10 rounded-lg transition">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by key or value..."
          className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-white/30 transition"
        />
      </div>

      {/* New Key Form */}
      {showNew && (
        <div className="bg-[#0a0a0a] border border-emerald-500/20 rounded-xl p-6 mb-6 animate-fade-in">
          <h3 className="text-sm font-bold mb-4 text-emerald-400">Add New Translation Key</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Key (dot.path)</label>
              <input
                type="text"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                placeholder="section.myNewKey"
                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">
                🇺🇸 English <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newEn}
                onChange={e => setNewEn(e.target.value)}
                placeholder="English value"
                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">
                🇦🇷 Español <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newEs}
                onChange={e => setNewEs(e.target.value)}
                placeholder="Valor en español"
                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
              />
            </div>
          </div>
          <button
            onClick={handleAddKey}
            className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition text-sm"
          >
            Create Key
          </button>
        </div>
      )}

      {/* Translation Groups */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([prefix, groupRows]) => (
          <div key={prefix} className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
            {/* Group Header */}
            <div className="bg-[#0f0f0f] px-6 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {prefix}
              </span>
              <span className="text-[10px] text-gray-600">
                {groupRows.length} key{groupRows.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/5">
              {groupRows.map(row => (
                <div key={row.translation_key} className="p-4 hover:bg-white/[0.02] transition">
                  {/* Key Label */}
                  <div className="flex items-center justify-between mb-2">
                    <code className={`text-xs font-mono ${dirty.has(row.translation_key) ? 'text-amber-400' : 'text-gray-500'}`}>
                      {row.translation_key}
                      {dirty.has(row.translation_key) && <span className="ml-2 text-[9px]">●</span>}
                    </code>
                    <button
                      onClick={() => handleDelete(row.translation_key)}
                      className="p-1 text-gray-700 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                      title="Delete key"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* EN / ES side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-600 uppercase font-bold mb-1">🇺🇸 EN</label>
                      <textarea
                        value={row.value_en}
                        onChange={e => handleChange(row.translation_key, 'value_en', e.target.value)}
                        rows={row.value_en.includes('\n') ? 3 : 1}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30 transition resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-600 uppercase font-bold mb-1">🇦🇷 ES</label>
                      <textarea
                        value={row.value_es}
                        onChange={e => handleChange(row.translation_key, 'value_es', e.target.value)}
                        rows={row.value_es.includes('\n') ? 3 : 1}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30 transition resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-16 text-gray-500 bg-[#111] rounded-xl border border-white/10">
          {search ? 'No translations match your search' : 'No translations yet. Add your first key above.'}
        </div>
      )}
    </div>
  );
};
