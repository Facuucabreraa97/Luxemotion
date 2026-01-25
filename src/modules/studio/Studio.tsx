
import React, { useState } from 'react';
import { MarketService } from '@/services/market.service';
import { StorageService } from '@/services/storage.service';
import { supabase } from '@/lib/supabase';
import { Image, Type, Upload, X, Film, Sparkles } from 'lucide-react';

export const Studio = ({ credits, setCredits }: any) => {
    const [mode, setMode] = useState<'text' | 'image'>('text');
    const [prompt, setPrompt] = useState('');
    const [startImage, setStartImage] = useState<File | null>(null);
    const [endImage, setEndImage] = useState<File | null>(null);

    // Preview URLs for UI
    const [startPreview, setStartPreview] = useState<string>('');
    const [endPreview, setEndPreview] = useState<string>('');
    const [videoUrl, setVideoUrl] = useState<string>('');

    const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'PROCESSING' | 'SAVING'>('IDLE');
    // const [supply, setSupply] = useState(1);
    // const [price, setPrice] = useState(0);

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
            // 1. Upload Images to Storage
            let startUrl = '';

            if (mode === 'image' && startImage) {
                setStatus('UPLOADING');
                startUrl = await StorageService.uploadFile(startImage, 'studio_uploads');
            }

            setStatus('PROCESSING');
            // 2. Call AI Service (Real Replicate)
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    start_image_url: startUrl || undefined
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Generation failed');
            }

            const { output } = await response.json();
            const resultUrl = Array.isArray(output) ? output[0] : output;

            setVideoUrl(resultUrl);
            setStatus('IDLE');

        } catch (e: any) {
            alert("Error: " + e.message);
            setStatus('IDLE');
        }
    };

    const handleSaveDraft = async () => {
        setStatus('SAVING');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Please Login to Save");

            await MarketService.saveDraft({
                name: prompt.substring(0, 30) || 'Untitled Creation',
                description: prompt,
                image_url: startPreview || 'https://via.placeholder.com/1080x1920?text=Video+Asset', // Using preview as cover for now
                video_url: videoUrl,
                price: 0,
                supply_total: 1,
                royalty_percent: 5
            }, user.id);

            alert("Saved to Gallery Drafts!");
            // Reset
            setVideoUrl('');
            setPrompt('');
            setStartPreview('');
            setStartImage(null);
            setStatus('IDLE');

        } catch (e: any) {
            alert("Save Failed: " + e.message);
            setStatus('IDLE');
        }
    };

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col gap-6 animate-slide-up text-white p-6 md:p-8">
            <header className="flex flex-col gap-1">
                <h2 className="text-4xl md:text-5xl font-display font-medium tracking-tight text-white">
                    Creation Studio
                </h2>
                <p className="text-gray-400 font-light max-w-2xl">
                    Generate cinematic assets. Choose your input modality.
                </p>
            </header>

            <div className="grid lg:grid-cols-12 gap-8 h-full min-h-[600px]">
                {/* CONTROLS */}
                <div className="lg:col-span-5 flex flex-col gap-6">

                    {/* MODE SWITCHER */}
                    <div className="glass-panel p-1 rounded-xl flex">
                        <button
                            onClick={() => setMode('text')}
                            className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-bold tracking-wide transition-all ${mode === 'text' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Type size={16} /> Text to Video
                        </button>
                        <button
                            onClick={() => setMode('image')}
                            className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-bold tracking-wide transition-all ${mode === 'image' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Image size={16} /> Image to Video
                        </button>
                    </div>

                    {/* INPUT AREA */}
                    <div className="glass-panel p-6 rounded-3xl flex-1 flex flex-col gap-4">

                        {mode === 'image' && (
                            <div className="grid grid-cols-2 gap-4 mb-2">
                                {/* START IMAGE */}
                                <div className="aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-white/30 transition-colors relative flex flex-col items-center justify-center overflow-hidden group bg-black/20">
                                    {startPreview ? (
                                        <>
                                            <img src={startPreview} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                            <button onClick={() => { setStartImage(null); setStartPreview(''); }} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-red-500/80 transition-colors"><X size={14} /></button>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="text-gray-500 mb-2" />
                                            <span className="text-[10px] uppercase font-bold text-gray-500">Start Image</span>
                                        </>
                                    )}
                                    <input type="file" onChange={e => handleImageUpload(e, 'start')} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                </div>

                                {/* END IMAGE (OPTIONAL) */}
                                <div className="aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-white/30 transition-colors relative flex flex-col items-center justify-center overflow-hidden group bg-black/20">
                                    {endPreview ? (
                                        <>
                                            <img src={endPreview} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                            <button onClick={() => { setEndImage(null); setEndPreview(''); }} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-red-500/80 transition-colors"><X size={14} /></button>
                                        </>
                                    ) : (
                                        <>
                                            <Film className="text-gray-500 mb-2" />
                                            <span className="text-[10px] uppercase font-bold text-gray-500">End Frame (Opt)</span>
                                        </>
                                    )}
                                    <input type="file" onChange={e => handleImageUpload(e, 'end')} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                </div>
                            </div>
                        )}

                        <div className="flex-1 flex flex-col">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Prompt</label>
                            <textarea
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                className="w-full flex-1 bg-transparent text-white text-lg font-light outline-none resize-none placeholder-gray-700 leading-relaxed"
                                placeholder={mode === 'text' ? "A futuristic city with neon lights..." : "Describe the motion... (e.g. Camera zooms in, explosion happens)"}
                            />
                        </div>
                    </div>


                    {/* SETTINGS REMOVED FOR DRAFT WORKFLOW */}

                    {!videoUrl ? (
                        <button
                            onClick={handleCreate}
                            disabled={status !== 'IDLE' || (!prompt && mode === 'text') || (!startImage && mode === 'image')}
                            className={`w-full py-4 rounded-xl font-bold text-lg tracking-wide shadow-2xl transition-all ${status === 'IDLE'
                                ? 'bg-white text-black hover:scale-[1.01] hover:shadow-white/20'
                                : 'bg-accent text-white cursor-not-allowed'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                {status === 'IDLE' && <Sparkles size={20} fill="black" />}
                                {status === 'IDLE' ? 'Generate Preview' : status === 'UPLOADING' ? 'Uploading Assets...' : 'Generating...'}
                            </div>
                        </button>
                    ) : (
                        <div className="flex gap-4">
                            <button
                                onClick={handleSaveDraft}
                                disabled={status === 'SAVING'}
                                className="flex-1 bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                {status === 'SAVING' ? 'Saving...' : 'Save to Gallery'}
                            </button>
                            <button
                                onClick={() => { setVideoUrl(''); setStatus('IDLE'); }}
                                className="px-6 border border-white/20 rounded-xl hover:bg-white/10 transition-colors"
                            >
                                Discard
                            </button>
                        </div>
                    )}

                </div>

                {/* VISUALIZER */}
                <div className="lg:col-span-7">
                    <div className="w-full h-full glass-panel rounded-3xl flex items-center justify-center relative overflow-hidden bg-black/40">
                        {status === 'IDLE' && !startPreview && !videoUrl && (
                            <div className="text-center opacity-30">
                                <div className="text-6xl mb-4 grayscale flex justify-center">💠</div>
                                <p className="font-light tracking-widest uppercase text-xs">Waiting for Input</p>
                            </div>
                        )}

                        {startPreview && status === 'IDLE' && !videoUrl && (
                            <img src={startPreview} className="w-full h-full object-contain opacity-50 blur-sm scale-105" />
                        )}

                        {videoUrl && (
                            <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
                        )}

                        {status !== 'IDLE' && status !== 'SAVING' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-20">
                                <div className="w-16 h-16 border-4 border-t-accent border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-6"></div>
                                <p className="text-accent font-mono text-sm animate-pulse tracking-widest uppercase">{status}...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};