// src/modules/studio/Studio.tsx
// v2 — Mobile responsive, auto-save aware, i18n fixes, toast instead of alert
import React, { useState, useEffect, useCallback } from 'react';
import { Asset } from '@/types';
import { MarketService } from '@/services/market.service';
import { StorageService } from '@/services/storage.service';
import { supabase } from '@/lib/supabase';
import { Upload, X, Film, Sparkles, Settings, ChevronDown, ChevronUp, Zap, Clapperboard, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { useVideoGeneration } from '@/context/VideoGenerationContext';
import { WalletDisplay } from './WalletDisplay';
import { GenerationProgress } from '@/features/creation/components/GenerationProgress';
import { PromptHistory } from './PromptHistory';
import { useTranslation } from '@/context/LanguageContext';
import toast from 'react-hot-toast';

export const Studio = () => {
  const { isGenerating, startGeneration, status, lastGeneratedUrl } = useVideoGeneration();
  const { t } = useTranslation();
  const [localStatus, setLocalStatus] = useState<'IDLE' | 'UPLOADING' | 'SAVING' | 'PROCESSING'>('IDLE');

  const [mode, setMode] = useState<'text' | 'image' | 'image_gen'>('text');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [styleMode, setStyleMode] = useState<'cinematic' | 'organic'>('organic');
  const [prompt, setPrompt] = useState('');
  const [startImage, setStartImage] = useState<File | null>(null);
  const [endImage, setEndImage] = useState<File | null>(null);

  const [duration, setDuration] = useState<'5' | '10'>('5');
  const [seed, setSeed] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<'draft' | 'master'>('draft');

  const [tierCosts, setTierCosts] = useState({ image: 15, draft: 50, master_5s: 400, master_10s: 800 });
  const [modelNames, setModelNames] = useState({ image: 'Flux Dev', draft: 'Wan 2.1', master: 'Kling v2.5 Pro' });

  useEffect(() => {
    fetch('/api/get-models')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const img = data.image?.[0]; const dft = data.draft?.[0]; const mst = data.master?.[0];
        setTierCosts({ image: img?.cost ?? 15, draft: dft?.cost ?? 50, master_5s: mst?.cost ?? 400, master_10s: mst?.cost_10s ?? 800 });
        setModelNames({ image: img?.name ?? 'Flux Dev', draft: dft?.name ?? 'Wan 2.1', master: mst?.name ?? 'Kling v2.5 Pro' });
      })
      .catch(() => {});
  }, []);

  const cost = mode === 'image_gen' ? tierCosts.image : selectedTier === 'draft' ? tierCosts.draft : duration === '10' ? tierCosts.master_10s : tierCosts.master_5s;

  const [startPreview, setStartPreview] = useState<string>('');
  const [endPreview, setEndPreview] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [lastMetadata, setLastMetadata] = useState<Pick<Asset, 'seed' | 'generation_config' | 'prompt_structure'> | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState<boolean>(true);

  // ── SESSION PERSISTENCE ──
  const SESSION_KEY = 'luxemotion_studio_state';
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const s = JSON.parse(saved);
        if (s.prompt) setPrompt(s.prompt);
        if (s.duration) setDuration(s.duration);
        if (s.selectedTier) setSelectedTier(s.selectedTier);
        if (s.styleMode) setStyleMode(s.styleMode);
        if (s.aspectRatio) setAspectRatio(s.aspectRatio);
        if (s.mode) setMode(s.mode);
        if (s.seed) setSeed(s.seed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ prompt, duration, selectedTier, styleMode, aspectRatio, mode, seed }));
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [prompt, duration, selectedTier, styleMode, aspectRatio, mode, seed]);

  useEffect(() => {
    if (lastGeneratedUrl) {
      setVideoUrl(lastGeneratedUrl);
      setLocalStatus('IDLE');
      // Auto-save is handled by DB trigger now
      toast.success(t('studio.autoSaved'), { duration: 4000, icon: '✅' });
    }
  }, [lastGeneratedUrl]);

  const fetchCredits = useCallback(async () => {
    try {
      setLoadingCredits(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch('/api/get-credits', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setCredits(data.credits);
    } catch (e) { console.error('Failed to fetch credits:', e); }
    finally { setLoadingCredits(false); }
  }, []);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === 'start') { setStartImage(file); setStartPreview(URL.createObjectURL(file)); }
    else { setEndImage(file); setEndPreview(URL.createObjectURL(file)); }
  };

  const handleGenerate = async () => {
    if (localStatus !== 'IDLE' || isGenerating) return;
    if (!prompt.trim() && mode === 'text') { toast.error('Please enter a prompt'); return; }
    if (mode === 'image' && !startImage) { toast.error('Please upload a start image'); return; }
    if (credits !== null && credits < cost) { toast.error(t('studio.insufficientCredits') + ` (${credits} < ${cost})`); return; }

    setLocalStatus('UPLOADING');
    try {
      let startImageUrl = '';
      let endImageUrl = '';
      if (startImage) { startImageUrl = await StorageService.uploadImage(startImage); }
      if (endImage) { endImageUrl = await StorageService.uploadImage(endImage); }

      setLocalStatus('PROCESSING');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please login to generate');

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          prompt, start_image: startImageUrl || undefined, end_image: endImageUrl || undefined,
          aspect_ratio: aspectRatio, style_mode: styleMode, duration,
          ...(seed ? { seed: parseInt(seed) } : {}),
          tier: mode === 'image_gen' ? 'image' : selectedTier,
          type: mode === 'image_gen' ? 'image' : 'video',
          prompt_structure: { user_prompt: prompt, style_preset: styleMode },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        const errorData = (() => { try { return JSON.parse(text); } catch { return { error: text }; } })();
        if (response.status === 402) throw new Error(t('studio.insufficientCredits'));
        if (response.status === 429) { toast.error('System busy, please wait 5 seconds'); setLocalStatus('IDLE'); return; }
        throw new Error(`Server Error (${response.status}): ${errorData.error || text}`);
      }

      const initialData = await response.json();
      const predictionId = initialData.id;
      fetchCredits();
      if (initialData.lux_metadata) setLastMetadata(initialData.lux_metadata);

      const isFalProvider = initialData.provider?.startsWith('fal') || initialData.lux_metadata?.mode?.includes('kling-elements') || initialData.lux_metadata?.fal_request_id;
      const provider = isFalProvider ? 'fal' : undefined;
      startGeneration(predictionId, provider);
      setLocalStatus('IDLE');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unknown error');
      setLocalStatus('IDLE');
    }
  };

  // ── RENDER ──
  const isProcessing = isGenerating || localStatus === 'UPLOADING' || localStatus === 'PROCESSING';
  const canGenerate = !isProcessing && (prompt.trim() || (mode === 'image' && startImage));

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-6 text-white p-4 sm:p-6 md:p-8 pb-24 sm:pb-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('studio.title')}</h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">{t('studio.subtitle')}</p>
        </div>
        <WalletDisplay balance={credits} isLoading={loadingCredits} requiredCost={cost} />
      </header>

      <div className="grid lg:grid-cols-12 gap-4 sm:gap-6">
        {/* ══ CONTROLS COLUMN ══ */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-5 flex flex-col gap-5">

            {/* MODE TABS */}
            <div className="flex bg-black/40 p-1 rounded-xl">
              {[
                { key: 'text', label: t('studio.modeText'), icon: <Film size={13} /> },
                { key: 'image', label: t('studio.modeImage'), icon: <Sparkles size={13} /> },
                { key: 'image_gen', label: `${t('studio.modeImageGen')} (${tierCosts.image})`, icon: <ImageIcon size={13} /> },
              ].map((m) => (
                <button key={m.key} onClick={() => setMode(m.key as any)}
                  className={`flex-1 py-2.5 rounded-lg text-[11px] sm:text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    mode === m.key ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-white'
                  }`}>
                  {m.icon} <span className="hidden sm:inline">{m.label}</span>
                  <span className="sm:hidden">{m.key === 'text' ? 'T2V' : m.key === 'image' ? 'I2V' : 'IMG'}</span>
                </button>
              ))}
            </div>

            {/* ASPECT RATIO — FIX: was labeled "Quality Tier" */}
            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase block mb-2">{t('studio.aspectRatio')}</label>
              <div className="flex gap-2">
                {['16:9', '9:16', '1:1'].map((ratio) => (
                  <button key={ratio} onClick={() => setAspectRatio(ratio as any)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                      aspectRatio === ratio ? 'bg-white text-black border-white' : 'border-white/10 text-gray-500 hover:border-white/30'
                    }`}>{ratio}</button>
                ))}
              </div>
            </div>

            {/* STYLE SELECTOR */}
            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase block mb-2">{t('studio.styleVibe')}</label>
              <div className="flex gap-2">
                <button onClick={() => setStyleMode('cinematic')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                    styleMode === 'cinematic' ? 'bg-white text-black border-white' : 'border-white/10 text-gray-500 hover:border-white/30'
                  }`}>
                  {t('studio.styleCinematic')}
                  <span className="block text-[9px] font-normal mt-0.5 opacity-50">{t('studio.styleCinematicDesc')}</span>
                </button>
                <button onClick={() => setStyleMode('organic')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                    styleMode === 'organic' ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border-purple-500/50' : 'border-white/10 text-gray-500 hover:border-white/30'
                  }`}>
                  {t('studio.styleOrganic')}
                  <span className="block text-[9px] font-normal mt-0.5 opacity-50">{t('studio.styleOrganicDesc')}</span>
                </button>
              </div>
            </div>

            {/* QUALITY TIER (hidden in image_gen mode) */}
            {mode !== 'image_gen' && (
              <div>
                <label className="text-[10px] font-medium text-gray-500 uppercase block mb-2">{t('studio.tier')}</label>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedTier('draft')}
                    className={`flex-1 py-3 rounded-xl text-xs font-medium border-2 transition-all ${
                      selectedTier === 'draft' ? 'bg-blue-500/15 text-blue-400 border-blue-500/40' : 'border-white/10 text-gray-500 hover:border-white/20'
                    }`}>
                    <div className="flex items-center justify-center gap-1.5"><Zap size={13} />{t('studio.tierDraft')}</div>
                    <div className="text-[9px] mt-0.5 font-mono opacity-60">{tierCosts.draft} CR · {modelNames.draft}</div>
                  </button>
                  <button onClick={() => setSelectedTier('master')}
                    className={`flex-1 py-3 rounded-xl text-xs font-medium border-2 transition-all ${
                      selectedTier === 'master' ? 'bg-amber-500/15 text-amber-400 border-amber-500/40' : 'border-white/10 text-gray-500 hover:border-white/20'
                    }`}>
                    <div className="flex items-center justify-center gap-1.5"><Clapperboard size={13} />{t('studio.tierMaster')}</div>
                    <div className="text-[9px] mt-0.5 font-mono opacity-60">{tierCosts.master_5s} CR · {modelNames.master}</div>
                  </button>
                </div>
              </div>
            )}

            {/* DURATION (only for video, hidden in image mode) */}
            {mode !== 'image_gen' && selectedTier === 'master' && (
              <div>
                <label className="text-[10px] font-medium text-gray-500 uppercase block mb-2">{t('studio.duration')}</label>
                <div className="flex gap-2">
                  {['5', '10'].map((d) => (
                    <button key={d} onClick={() => setDuration(d as '5' | '10')}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                        duration === d ? 'bg-white text-black border-white' : 'border-white/10 text-gray-500'
                      }`}>
                      {d}s
                      <span className="text-[9px] ml-1 opacity-60">({d === '5' ? tierCosts.master_5s : tierCosts.master_10s} CR)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* IMAGE UPLOADS (only in image mode) */}
            {mode === 'image' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-white/30 transition relative flex flex-col items-center justify-center overflow-hidden bg-black/20">
                  {startPreview ? (
                    <>
                      <img src={startPreview} className="w-full h-full object-cover opacity-80" />
                      <button onClick={() => { setStartImage(null); setStartPreview(''); }}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-full text-white hover:bg-red-500"><X size={12} /></button>
                    </>
                  ) : (
                    <div className="text-center p-3">
                      <Upload className="mx-auto text-gray-600 mb-1" size={18} />
                      <span className="text-[10px] font-medium text-gray-500">{t('studio.startFrame')}</span>
                    </div>
                  )}
                  <input type="file" onChange={(e) => handleImageUpload(e, 'start')} className="absolute inset-0 opacity-0 cursor-pointer" accept=".png,.jpg,.jpeg,.webp,.gif" />
                </div>
                <div className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-white/30 transition relative flex flex-col items-center justify-center overflow-hidden bg-black/20">
                  {endPreview ? (
                    <>
                      <img src={endPreview} className="w-full h-full object-cover opacity-80" />
                      <button onClick={() => { setEndImage(null); setEndPreview(''); }}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-full text-white hover:bg-red-500"><X size={12} /></button>
                    </>
                  ) : (
                    <div className="text-center p-3">
                      <Upload className="mx-auto text-gray-600 mb-1" size={18} />
                      <span className="text-[10px] font-medium text-gray-500">{t('studio.endFrame')}</span>
                      <span className="text-[8px] text-gray-600 block">{t('studio.productOptional')}</span>
                    </div>
                  )}
                  <input type="file" onChange={(e) => handleImageUpload(e, 'end')} className="absolute inset-0 opacity-0 cursor-pointer" accept=".png,.jpg,.jpeg,.webp,.gif" />
                </div>
              </div>
            )}

            {/* PROMPT */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-medium text-gray-500 uppercase">{t('studio.promptLabel')}</label>
                <PromptHistory onSelect={(p) => setPrompt(p)} />
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t('studio.promptPlaceholder')}
                rows={3}
                className="w-full bg-black/30 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/40 resize-none transition"
              />
            </div>

            {/* ADVANCED */}
            <button onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-[10px] text-gray-600 hover:text-gray-400 transition">
              <Settings size={12} />{t('studio.advanced')} {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showAdvanced && (
              <input type="text" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder={t('studio.seed')}
                className="w-full bg-black/30 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 font-mono" />
            )}

            {/* GENERATE BUTTON */}
            {!videoUrl ? (
              <button onClick={handleGenerate} disabled={!canGenerate}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all relative overflow-hidden ${
                  canGenerate
                    ? 'bg-white text-black hover:bg-gray-100 active:scale-[0.98]'
                    : 'bg-white/10 text-gray-500 cursor-not-allowed'
                }`}>
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin w-4 h-4 border-2 border-black/20 border-t-black rounded-full" />
                    {localStatus === 'UPLOADING' ? t('studio.startImage') + '...' : t('studio.generating')}
                  </span>
                ) : (
                  <span>{t('studio.generate')} · {cost} CR</span>
                )}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                  <CheckCircle2 size={14} />
                  <span>{t('studio.autoSaved')}</span>
                </div>
                <button onClick={() => { setVideoUrl(''); setPrompt(''); setStartPreview(''); setStartImage(null); setLocalStatus('IDLE'); }}
                  className="w-full py-2.5 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition">
                  New Generation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ══ PREVIEW COLUMN ══ */}
        <div className="lg:col-span-8">
          <div className="w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] bg-black/40 border border-white/[0.04] rounded-2xl flex items-center justify-center relative overflow-hidden">
            {/* Empty State */}
            {!videoUrl && !startPreview && !isGenerating && localStatus === 'IDLE' && (
              <div className="text-center opacity-15">
                <div className="text-7xl sm:text-8xl mb-3 font-thin">&#10022;</div>
                <p className="text-xs uppercase tracking-[0.2em]">{t('studio.waitingInput')}</p>
              </div>
            )}

            {/* Image Preview */}
            {startPreview && !videoUrl && !isGenerating && (
              <img src={startPreview} className="w-full h-full object-contain opacity-40 blur-lg scale-110" />
            )}

            {/* Video Result */}
            {videoUrl && (
              <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
            )}

            {/* Generation Progress Overlay */}
            {isGenerating && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-10 p-6 sm:p-8">
                <div className="w-full max-w-md">
                  <div className="mb-6 text-center">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">{t('studio.creating')}</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                      {selectedTier === 'draft' ? `Draft · ${modelNames.draft}` : `Master · ${modelNames.master}`}
                    </p>
                  </div>
                  <GenerationProgress status={status} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
