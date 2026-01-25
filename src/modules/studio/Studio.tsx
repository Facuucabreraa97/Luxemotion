
import React, { useState } from 'react';
import { MarketService } from '@/services/market.service';
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

    const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'PROCESSING' | 'MINTING'>('IDLE');
    const [supply, setSupply] = useState(1);
    const [price, setPrice] = useState(0);

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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) console.warn("Demo Mode: No user");

            // 1. Upload Images to Storage (if applicable)
            let startUrl = '';
            // const endUrl = ''; 

            if (mode === 'image' && startImage) {
                setStatus('UPLOADING');
                // Simulate Upload
                await new Promise(r => setTimeout(r, 1000));
                startUrl = 'https://temp_storage_url';
            }

            setStatus('PROCESSING');
            // 2. Call AI Service (Mock for now, replacing next)
            await new Promise(r => setTimeout(r, 3000));

            setStatus('MINTING');
            // 3. Mint Asset
            if (user) {
                await MarketService.mintAsset({
                    name: prompt.substring(0, 30) || 'Untitled Creation',
                    description: prompt,
                    image_url: startPreview || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80',
                    video_url: 'https://cdn.openai.com/sora/video.mp4', // Placeholder result
                    price: price,
                    supply_total: supply,
                    royalty_percent: 5,
                    for_sale: true
                }, user.id);
            }

            if (setCredits) setCredits((prev: number) => prev - 50);
            setStatus('IDLE');
            alert("Asset Generated & Minted Successfully!");

        } catch (e: any) {
            alert("Error: " + e.message);
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

                    {/* SETTINGS */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-panel p-4 rounded-2xl">
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Supply</label>
                            <input type="number" value={supply} onChange={e => setSupply(Number(e.target.value))} className="bg-transparent text-xl font-medium text-white w-full outline-none" />
                        </div>
                        <div className="glass-panel p-4 rounded-2xl">
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Price (CR)</label>
                            <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="bg-transparent text-xl font-medium text-white w-full outline-none" />
                        </div>
                    </div>

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
                            {status === 'IDLE' ? 'Generate & Mint' : status === 'UPLOADING' ? 'Uploading Assets...' : 'Generating...'}
                        </div>
                    </button>
                </div>

                {/* VISUALIZER */}
                <div className="lg:col-span-7">
                    <div className="w-full h-full glass-panel rounded-3xl flex items-center justify-center relative overflow-hidden bg-black/40">
                        {status === 'IDLE' && !startPreview && (
                            <div className="text-center opacity-30">
                                <div className="text-6xl mb-4 grayscale flex justify-center">💠</div>
                                <p className="font-light tracking-widest uppercase text-xs">Waiting for Input</p>
                            </div>
                        )}

                        {startPreview && status === 'IDLE' && (
                            <img src={startPreview} className="w-full h-full object-contain opacity-50 blur-sm scale-105" />
                        )}

                        {status !== 'IDLE' && (
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