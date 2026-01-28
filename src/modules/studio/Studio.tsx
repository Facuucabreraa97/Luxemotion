import React, { useState, useEffect, useCallback } from 'react';
import { Asset } from '@/types';
import { MarketService } from '@/services/market.service';
import { StorageService } from '@/services/storage.service';
import { supabase } from '@/lib/supabase';
import { Upload, X, Film, Sparkles, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useVideoGeneration } from '@/context/VideoGenerationContext';
import { WalletDisplay } from './WalletDisplay';
import { GenerationProgress } from '@/features/creation/components/GenerationProgress';

export const Studio = () => {
  const { isGenerating, startGeneration, status, lastGeneratedUrl } = useVideoGeneration();
  const [localStatus, setLocalStatus] = useState<'IDLE' | 'UPLOADING' | 'SAVING'>('IDLE');

  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9'); // NEW STATE
  const [prompt, setPrompt] = useState('');
  const [startImage, setStartImage] = useState<File | null>(null);
  const [endImage, setEndImage] = useState<File | null>(null);

  // REMIX STATE
  const [duration, setDuration] = useState<'5' | '10'>('5'); // NEW DURATION STATE
  const [seed, setSeed] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Preview URLs for UI
  const [startPreview, setStartPreview] = useState<string>('');
  const [endPreview, setEndPreview] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');

  const [lastMetadata, setLastMetadata] = useState<Pick<
    Asset,
    'seed' | 'generation_config' | 'prompt_structure'
  > | null>(null); // Store metadata for saving

  // WALLET STATE
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState<boolean>(true);

  // Cost Calculation
  const cost = duration === '10' ? 100 : 50;

  // Auto-Update Video URL when generation finishes
  useEffect(() => {
    if (lastGeneratedUrl) {
      setVideoUrl(lastGeneratedUrl);
      // Clean up inputs to show fresh state
      setLocalStatus('IDLE');
    }
  }, [lastGeneratedUrl]);

  const fetchCredits = useCallback(async () => {
    try {
      setLoadingCredits(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      // Switched to Vercel API Route to avoid CLI deployment issues
      const response = await fetch('/api/get-credits', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch credits');
      const data = await response.json();

      setCredits(data.credits);
    } catch (e) {
      console.error('Failed to fetch credits:', e);
    } finally {
      setLoadingCredits(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'start') {
        setStartImage(file);
        setStartPreview(url);
      } else {
        setEndImage(file);
        setEndPreview(url);
      }
    }
  };

  const handleCreate = async () => {
    if (!prompt && mode === 'text') return;
    if (!startImage && mode === 'image') return;

    // Client-side pre-check
    if (credits !== null && credits < cost) {
      alert('Insufficient Credits. Please top up your wallet.');
      return;
    }

    // Use localStatus for immediate feedback before API call
    setLocalStatus('UPLOADING');

    try {
      let startUrl = '';
      let endUrl = '';

      if (mode === 'image') {
        if (startImage) {
          startUrl = await StorageService.uploadFile(startImage, 'studio_uploads');
        }
        if (endImage) {
          endUrl = await StorageService.uploadFile(endImage, 'studio_uploads');
        }
      }

      setLocalStatus('IDLE'); // Ready to call API

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required');

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt,
          start_image_url: startUrl || undefined,
          subject_image_url: startUrl || undefined, // Send both to be safe
          end_image_url: endUrl || undefined,
          context_image_url: endUrl || undefined, // Send both to be safe
          aspect_ratio: aspectRatio,
          duration: duration,
          seed: seed ? seed : undefined,
          prompt_structure: {
            user_prompt: prompt,
            style_preset: 'cinematic, 4k, high quality, photorealistic',
          },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        const errorData = (() => {
          try {
            return JSON.parse(text);
          } catch {
            return { error: text };
          }
        })(); // Safe parse

        if (response.status === 402) {
          throw new Error(`Insufficient Credits! ${errorData.error}`);
        }
        throw new Error(`Server Error (${response.status}): ${errorData.error || text}`);
      }

      const initialData = await response.json();
      const predictionId = initialData.id;

      // Update local wallet (Optimistic or refetch)
      // Refetch is safer to sync with server
      fetchCredits();

      if (initialData.lux_metadata) {
        setLastMetadata(initialData.lux_metadata);
      }

      // Start Global Polling
      startGeneration(predictionId);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      alert('Error: ' + message);
      setLocalStatus('IDLE');
    }
  };

  const handleSaveDraft = async () => {
    setLocalStatus('SAVING');
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Please Login to Save');

      await MarketService.saveDraft(
        {
          name: prompt.substring(0, 30) || 'Untitled Creation',

          image_url: startPreview || 'https://via.placeholder.com/1080x1920?text=Video+Asset',
          video_url: videoUrl,
          price: 0,
          supply_total: 1,
          royalty_percent: 5,
          // PASS METADATA TO SERVICE
          seed: lastMetadata?.seed,
          generation_config: lastMetadata?.generation_config,
          prompt_structure: lastMetadata?.prompt_structure,
        },
        user.id
      );

      alert('Saved to Gallery Drafts!');
      setVideoUrl('');
      setPrompt('');
      setStartPreview('');
      setStartImage(null);
      setLocalStatus('IDLE');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      alert('Save Failed: ' + message);
      setLocalStatus('IDLE');
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col gap-6 animate-fade-in text-white p-6 md:p-8">
      <header className="mb-4">
        <h2 className="text-4xl font-display font-semibold tracking-tight text-white">Studio</h2>
      </header>

      <div className="grid lg:grid-cols-12 gap-8 h-full min-h-[400px] md:min-h-[600px]">
        {/* SETTINGS COLUMN */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* WALLET DISPLAY */}
          <WalletDisplay balance={credits} isLoading={loadingCredits} requiredCost={cost} />

          {/* INPUT CARD */}
          <div className="bg-[#111] border border-white/5 rounded-3xl p-6 flex flex-col gap-6 shadow-2xl">
            {/* MODE TABS */}
            <div className="flex bg-black/50 p-1 rounded-xl">
              {['text', 'image'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m as 'text' | 'image')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === m ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                >
                  {m} to Video
                </button>
              ))}
            </div>

            {/* ASPECT RATIO */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-3">
                Format
              </label>
              <div className="flex gap-2">
                {['16:9', '9:16', '1:1'].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio as '16:9' | '9:16' | '1:1')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${aspectRatio === ratio ? 'bg-white text-black border-white' : 'border-white/10 text-gray-500 hover:border-white/30'}`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* PROMPT / IMAGE INPUT */}
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-3">
                Input
              </label>

              {mode === 'image' && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* START IMAGE */}
                  <div className="aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-white/30 transition-colors relative flex flex-col items-center justify-center overflow-hidden group bg-black/20">
                    {startPreview ? (
                      <>
                        <img src={startPreview} className="w-full h-full object-cover opacity-80" />
                        <button
                          onClick={() => {
                            setStartImage(null);
                            setStartPreview('');
                          }}
                          className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-red-500 text-white"
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="mx-auto text-gray-500 mb-2" size={20} />
                        <span className="text-[10px] uppercase font-bold text-gray-500">
                          Subject
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      onChange={(e) => handleImageUpload(e, 'start')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept="image/*"
                    />
                  </div>

                  {/* END IMAGE (OPTIONAL) */}
                  <div className="aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-white/30 transition-colors relative flex flex-col items-center justify-center overflow-hidden group bg-black/20">
                    {endPreview ? (
                      <>
                        <img src={endPreview} className="w-full h-full object-cover opacity-80" />
                        <button
                          onClick={() => {
                            setEndImage(null);
                            setEndPreview('');
                          }}
                          className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-red-500 text-white"
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Film className="mx-auto text-gray-500 mb-2" size={20} />
                        <span className="text-[10px] uppercase font-bold text-gray-500">
                          Context (End)
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      onChange={(e) => handleImageUpload(e, 'end')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept="image/*"
                    />
                  </div>
                </div>
              )}

              <div className="mb-6 animate-fade-in bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Duration</span>
                  <span className="text-xs font-mono text-white bg-black/50 px-2 py-1 rounded">
                    {duration}s
                  </span>
                </div>
                <div className="flex gap-2">
                  {['5', '10'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d as '5' | '10')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${duration === d ? 'bg-white text-black border-white' : 'border-white/10 text-gray-500 hover:border-white/30'}`}
                    >
                      {d} Segundos
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-32 bg-transparent border-0 outline-none text-white placeholder-gray-700 text-sm leading-relaxed resize-none font-medium"
                placeholder={
                  mode === 'text'
                    ? 'Describe your vision in detail...'
                    : 'Describe the motion for this image...'
                }
              />
            </div>

            {/* ADVANCED SETTINGS */}
            <div className="border-t border-white/10 pt-4 mb-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-500 hover:text-white transition-colors w-full"
              >
                <Settings size={12} />
                Advanced Settings
                {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {showAdvanced && (
                <div className="mt-4 animate-fade-in space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">
                      Seed (Optional)
                    </label>
                    <input
                      type="number"
                      placeholder="Random (-1)"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-white/30 outline-none transition-all placeholder:text-gray-700 font-mono"
                    />
                    <p className="text-[10px] text-gray-600 mt-1">
                      Use a specific seed to reproduce results.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION BUTTON */}
            {!videoUrl ? (
              <button
                onClick={() => {
                  if (credits !== null && credits < cost) return;
                  handleCreate();
                  if (window.innerWidth < 1024) {
                    setTimeout(
                      () =>
                        document
                          .getElementById('preview-area')
                          ?.scrollIntoView({ behavior: 'smooth' }),
                      100
                    );
                  }
                }}
                disabled={
                  isGenerating ||
                  localStatus !== 'IDLE' ||
                  (!prompt && mode === 'text') ||
                  (credits !== null && credits < cost)
                }
                className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2
                    ${
                      isGenerating ||
                      localStatus !== 'IDLE' ||
                      (!prompt && mode === 'text') ||
                      (credits !== null && credits < cost)
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-white text-black hover:scale-[1.02]'
                    }
                `}
              >
                {localStatus === 'IDLE' && !isGenerating ? (
                  <>
                    <Sparkles size={16} />
                    {credits !== null && credits < cost
                      ? 'Insufficient Credits'
                      : `Generate (${cost} CR)`}
                  </>
                ) : (
                  <span className="animate-pulse">
                    {localStatus === 'UPLOADING' ? 'Uploading...' : 'Processing...'}
                  </span>
                )}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveDraft}
                  disabled={localStatus === 'SAVING'}
                  className="flex-1 py-3 bg-white text-black rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  {localStatus === 'SAVING' ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={() => {
                    setVideoUrl('');
                    setLocalStatus('IDLE');
                  }}
                  className="px-4 py-3 border border-white/20 rounded-lg text-white font-bold text-sm hover:bg-white/10 transition-colors"
                >
                  Discard
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PREVIEW COLUMN */}
        <div className="lg:col-span-8 h-full" id="preview-area">
          <div className="w-full h-full min-h-[400px] bg-[#0A0A0A] border border-white/5 rounded-3xl flex items-center justify-center relative overflow-hidden group">
            {/* Empty State */}
            {!videoUrl && !startPreview && !isGenerating && localStatus === 'IDLE' && (
              <div className="text-center opacity-20 group-hover:opacity-30 transition-opacity">
                <div className="text-8xl mb-4 font-thin">❖</div>
                <p className="text-xs uppercase tracking-[0.2em]">Waiting for Input</p>
              </div>
            )}

            {/* Image Preview */}
            {startPreview && !videoUrl && (
              <img
                src={startPreview}
                className="w-full h-full object-contain opacity-50 blur-lg scale-110"
              />
            )}

            {/* Video Result */}
            {videoUrl && (
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain shadow-2xl"
              />
            )}

            {/* Generation Progress Overlay */}
            {isGenerating && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-8">
                <div className="w-full max-w-md">
                  <div className="mb-8 text-center">
                    <h3 className="text-2xl font-display font-medium text-white mb-2">
                      Creating Reality
                    </h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">
                      AI Model v2.5 Turbo Pro
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
