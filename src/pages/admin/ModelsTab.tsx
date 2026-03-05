import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, RefreshCw, Zap, Clapperboard, Image, Film, AlertCircle } from 'lucide-react';

interface AIModel {
  id: string;
  model_type: 'image' | 'video';
  provider: string;
  fal_model_id: string;
  display_name: string;
  description: string;
  tier: 'image' | 'draft' | 'master';
  credits_cost: number;
  credits_cost_10s: number | null;
  resolution: string | null;
  max_duration: string | null;
  is_active: boolean;
  sort_order: number;
}

export const ModelsTab = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadModels = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to load models:', error.message);
      showToast('❌ Failed to load models');
    } else {
      setModels(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const handleToggle = (id: string) => {
    setModels(prev =>
      prev.map(m => m.id === id ? { ...m, is_active: !m.is_active } : m)
    );
    setDirty(prev => new Set(prev).add(id));
  };

  const handleSave = async () => {
    if (dirty.size === 0) return;
    setSaving(true);

    try {
      const updates = models
        .filter(m => dirty.has(m.id))
        .map(m => ({ id: m.id, is_active: m.is_active }));

      // Validate: at least one active model per tier that has active models
      const activeTiers = new Map<string, number>();
      models.forEach(m => {
        if (m.is_active) {
          activeTiers.set(m.tier, (activeTiers.get(m.tier) || 0) + 1);
        }
      });

      // Check that we're not leaving a tier with 0 active models if it previously had some
      for (const update of updates) {
        const model = models.find(m => m.id === update.id);
        if (model && !update.is_active) {
          const tierCount = activeTiers.get(model.tier) || 0;
          if (tierCount === 0) {
            showToast(`⚠️ Cannot disable all ${model.tier} models. At least 1 must remain active.`);
            setSaving(false);
            return;
          }
        }
      }

      // Batch update
      for (const update of updates) {
        const { error } = await supabase
          .from('ai_models')
          .update({ is_active: update.is_active })
          .eq('id', update.id);

        if (error) throw error;
      }

      setDirty(new Set());
      showToast(`✓ Saved ${updates.length} model change(s)`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      showToast(`❌ Save failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const imageModels = models.filter(m => m.tier === 'image');
  const draftModels = models.filter(m => m.tier === 'draft');
  const masterModels = models.filter(m => m.tier === 'master');

  const tierIcon = (tier: string) => {
    if (tier === 'image') return <Image size={16} className="text-purple-400" />;
    if (tier === 'draft') return <Zap size={16} className="text-blue-400" />;
    return <Clapperboard size={16} className="text-amber-400" />;
  };

  const tierColor = (tier: string) => {
    if (tier === 'image') return 'purple';
    if (tier === 'draft') return 'blue';
    return 'amber';
  };

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#111] border border-white/10 text-white px-4 py-3 rounded-xl shadow-2xl text-sm animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Film size={22} /> AI Models
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Toggle models on/off to control what's available in the Studio. Changes take effect immediately after save.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadModels}
            disabled={loading}
            className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition text-sm flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={dirty.size === 0 || saving}
            className={`px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition ${
              dirty.size > 0
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save size={14} />
            {saving ? 'Saving...' : dirty.size > 0 ? `Save (${dirty.size})` : 'Saved'}
          </button>
        </div>
      </div>

      {/* Warning */}
      {dirty.size > 0 && (
        <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <AlertCircle size={16} />
          <span>You have unsaved changes. Click Save to apply.</span>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-20 animate-pulse">Loading models...</div>
      ) : (
        <>
          {/* IMAGE MODELS */}
          <ModelSection
            title="Image Generation"
            subtitle="Models for creating still images from text or reference images"
            models={imageModels}
            tier="image"
            tierIcon={tierIcon}
            tierColor={tierColor}
            dirty={dirty}
            onToggle={handleToggle}
          />

          {/* VIDEO DRAFT MODELS */}
          <ModelSection
            title="Video — Draft Tier"
            subtitle="Fast, affordable preview videos for testing motion and composition"
            models={draftModels}
            tier="draft"
            tierIcon={tierIcon}
            tierColor={tierColor}
            dirty={dirty}
            onToggle={handleToggle}
          />

          {/* VIDEO MASTER MODELS */}
          <ModelSection
            title="Video — Master Tier"
            subtitle="Cinema-grade, high-resolution final renders"
            models={masterModels}
            tier="master"
            tierIcon={tierIcon}
            tierColor={tierColor}
            dirty={dirty}
            onToggle={handleToggle}
          />
        </>
      )}
    </div>
  );
};

/* ═══ Section Component ═══ */
interface ModelSectionProps {
  title: string;
  subtitle: string;
  models: AIModel[];
  tier: string;
  tierIcon: (tier: string) => React.ReactNode;
  tierColor: (tier: string) => string;
  dirty: Set<string>;
  onToggle: (id: string) => void;
}

const ModelSection = ({ title, subtitle, models, tier, tierIcon, tierColor, dirty, onToggle }: ModelSectionProps) => {
  const color = tierColor(tier);
  const activeCount = models.filter(m => m.is_active).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        {tierIcon(tier)}
        <div>
          <h4 className="text-lg font-bold text-white">{title}</h4>
          <p className="text-gray-500 text-xs">{subtitle}</p>
        </div>
        <span className={`ml-auto text-xs font-mono px-2 py-1 rounded bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
          {activeCount}/{models.length} active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {models.map(model => (
          <ModelCard
            key={model.id}
            model={model}
            color={color}
            isDirty={dirty.has(model.id)}
            onToggle={() => onToggle(model.id)}
          />
        ))}
      </div>
    </div>
  );
};

/* ═══ Model Card Component ═══ */
interface ModelCardProps {
  model: AIModel;
  color: string;
  isDirty: boolean;
  onToggle: () => void;
}

const ModelCard = ({ model, color, isDirty, onToggle }: ModelCardProps) => {
  return (
    <div
      className={`relative p-5 rounded-2xl border transition-all duration-300 ${
        model.is_active
          ? `bg-${color}-500/5 border-${color}-500/30 shadow-[0_0_20px_rgba(var(--shadow),0.08)]`
          : 'bg-white/[0.02] border-white/5 opacity-60'
      } ${isDirty ? 'ring-2 ring-amber-500/40' : ''}`}
      style={{ '--shadow': color === 'purple' ? '168,85,247' : color === 'blue' ? '59,130,246' : '245,158,11' } as React.CSSProperties}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-bold text-white truncate">{model.display_name}</h5>
          <p className="text-[10px] text-gray-500 font-mono truncate mt-0.5">{model.fal_model_id}</p>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={onToggle}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-3 ${
            model.is_active ? `bg-${color}-500` : 'bg-gray-700'
          }`}
          style={{
            backgroundColor: model.is_active
              ? (color === 'purple' ? '#a855f7' : color === 'blue' ? '#3b82f6' : '#f59e0b')
              : '#374151'
          }}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              model.is_active ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">
        {model.description}
      </p>

      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">
          {model.credits_cost} CR{model.credits_cost_10s ? ` / ${model.credits_cost_10s} CR` : ''}
        </span>
        {model.resolution && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">
            {model.resolution}
          </span>
        )}
        {model.max_duration && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">
            {model.max_duration}
          </span>
        )}
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">
          {model.provider}
        </span>
      </div>

      {/* Dirty indicator */}
      {isDirty && (
        <div className="absolute top-2 right-16 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      )}
    </div>
  );
};
