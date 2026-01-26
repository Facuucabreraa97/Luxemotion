import React, { useState } from 'react';
import { MarketService } from '@/services/market.service';
import { StorageService } from '@/services/storage.service';
import { supabase } from '@/lib/supabase';
import { Upload, X, Film, Sparkles, Settings, ChevronDown, ChevronUp } from 'lucide-react';

export const Studio = () => {
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9'); // NEW STATE
  const [prompt, setPrompt] = useState('');
  const [startImage, setStartImage] = useState<File | null>(null);
  const [endImage, setEndImage] = useState<File | null>(null);

  // REMIX STATE
  const [motionBucketId, setMotionBucketId] = useState<number>(127);
  const [seed, setSeed] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Preview URLs for UI
  const [startPreview, setStartPreview] = useState<string>('');
  const [endPreview, setEndPreview] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');

  const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'PROCESSING' | 'SAVING'>('IDLE');

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

    setStatus('PROCESSING');

    try {
      let startUrl = '';
      let endUrl = '';

      if (mode === 'image') {
        if (startImage) {
          setStatus('UPLOADING');
          startUrl = await StorageService.uploadFile(startImage, 'studio_uploads');
        }
        if (endImage) {
          setStatus('UPLOADING');
          endUrl = await StorageService.uploadFile(endImage, 'studio_uploads');
        }
      }

      setStatus('PROCESSING');
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          start_image_url: startUrl || undefined,
          end_image_url: endUrl || undefined,
          aspect_ratio: aspectRatio,
          // REMIX FIELDS
          motion_bucket_id: mode === 'image' ? motionBucketId : undefined,
          seed: seed ? seed : undefined, // Send as string to preserve BigInt precision
          prompt_structure: {
            user_prompt: prompt,
            style_preset: 'cinematic, 4k, high quality, photorealistic',
          },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server Error (${response.status}): ${text}`);
      }

      // --- POLLING LOGIC START ---
      const initialData = await response.json();
      const predictionId = initialData.id;
      let status = initialData.status;
      let output = initialData.output;
      let pollCount = 0;

      // Loop while processing (max 5 minutes = ~75 attempts)
      while (status !== 'succeeded' && status !== 'failed' && status !== 'canceled') {
        if (pollCount > 75) throw new Error('Timeout: Generation took too long.');

        await new Promise((r) => setTimeout(r, 4000)); // Wait 4s

        const pollResponse = await fetch(`/api/generate?id=${predictionId}`);
        const pollData = await pollResponse.json();

        status = pollData.status;
        output = pollData.output;
        pollCount++;

        // Optional: Update UI with status (Processing... starting... predicting...)
        // console.log('Polling status:', status);
      }

      if (status !== 'succeeded') {
        throw new Error('Generation failed via Replicate (Status: ' + status + ')');
      }
      // --- POLLING LOGIC END ---

      const resultUrl = Array.isArray(output) ? output[0] : output;

      setVideoUrl(resultUrl);
      setStatus('IDLE');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      alert('Error: ' + message);
      setStatus('IDLE');
    }
  };

  const handleSaveDraft = async () => {
    setStatus('SAVING');
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Please Login to Save');

      await MarketService.saveDraft(
        {
          name: prompt.substring(0, 30) || 'Untitled Creation',
          description: prompt,
          image_url: startPreview || 'https://via.placeholder.com/1080x1920?text=Video+Asset',
          video_url: videoUrl,
          price: 0,
          supply_total: 1,
          royalty_percent: 5,
        },
        user.id
      );

      alert('Saved to Gallery Drafts!');
      setVideoUrl('');
      setPrompt('');
      setStartPreview('');
      setStartImage(null);
      setStatus('IDLE');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      alert('Save Failed: ' + message);
      setStatus('IDLE');
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

              {/* MOTION CONTROL (Image Mode Only) */}
              {mode === 'image' && (
                <div className="mb-6 animate-fade-in bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] uppercase font-bold text-gray-400">
                      Motion Strength
                    </span>
                    <span className="text-xs font-mono text-white bg-black/50 px-2 py-1 rounded">
                      {motionBucketId}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="255"
                    value={motionBucketId}
                    onChange={(e) => setMotionBucketId(Number(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                  <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-medium">
                    <span>Static (Low)</span>
                    <span>Dynamic (High)</span>
                  </div>
                </div>
              )}

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
                disabled={status !== 'IDLE' || (!prompt && mode === 'text')}
                className="w-full py-4 bg-white text-black rounded-xl font-bold text-sm tracking-wide hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'IDLE' ? (
                  <>
                    <Sparkles size={16} /> Generate Preview
                  </>
                ) : (
                  <span className="animate-pulse">Processing...</span>
                )}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveDraft}
                  disabled={status === 'SAVING'}
                  className="flex-1 py-3 bg-white text-black rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  {status === 'SAVING' ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={() => {
                    setVideoUrl('');
                    setStatus('IDLE');
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
            {!videoUrl && !startPreview && status === 'IDLE' && (
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

            {/* Loading Overlay */}
            {status !== 'IDLE' && status !== 'SAVING' && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                <p className="text-xs font-mono text-white/70 animate-pulse">
                  GENERATING PIXELS...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
