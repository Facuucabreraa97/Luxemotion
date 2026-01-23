import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Video, Layers, Settings2, Download, Maximize2, Loader2, UploadCloud } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function StudioConsole() {
    const [mode, setMode] = useState<'image' | 'video'>('image');
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt) return;
        setLoading(true);
        setResult(null);
        setEnhancedPrompt(null);

        try {
            const res = await fetch('/api/studio/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode, prompt, aspectRatio })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setResult(data.outputUrl);
            setEnhancedPrompt(data.enhancedPrompt);
        } catch (err) {
            console.error(err);
            alert("Generation Failed: " + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
            {/* LEFT SIDEBAR (COCKPIT) */}
            <aside className="w-[350px] bg-zinc-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col p-6 z-20 shadow-2xl">
                <div className="mb-8 flex items-center gap-2">
                    <Sparkles className="text-[#D4AF37]" />
                    <h1 className="text-xl font-bold tracking-widest text-[#E5E5E5]">STUDIO<span className="text-[#D4AF37]">.AI</span></h1>
                </div>

                {/* MODE TABS */}
                <div className="flex bg-black/40 p-1 rounded-xl mb-8 border border-white/5">
                    <button
                        onClick={() => setMode('image')}
                        className={cn("flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2", mode === 'image' ? "bg-[#D4AF37] text-black shadow-lg" : "text-zinc-500 hover:text-white")}
                    >
                        <ImageIcon size={14} /> Image
                    </button>
                    <button
                        onClick={() => setMode('video')}
                        className={cn("flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2", mode === 'video' ? "bg-[#D4AF37] text-black shadow-lg" : "text-zinc-500 hover:text-white")}
                    >
                        <Video size={14} /> Video
                    </button>
                </div>

                {/* VIDEO UPLOAD ZONE (Optional) */}
                {mode === 'video' && (
                    <div className="mb-6 border-dashed border-2 border-[#D4AF37]/30 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-[#D4AF37]/5 transition-colors cursor-pointer group">
                        <UploadCloud className="text-[#D4AF37] mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-[#D4AF37]">Drop Start Image</span>
                    </div>
                )}

                {/* PROMPT INPUT */}
                <div className="flex-1 flex flex-col gap-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Creative Prompt</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe your luxury vision..."
                        className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-[#D4AF37] resize-none transition-all"
                    />

                    {/* SETTINGS */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">Aspect Ratio</label>
                            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-zinc-300 focus:border-[#D4AF37] outline-none appearance-none">
                                <option value="16:9">16:9 Cinema</option>
                                <option value="9:16">9:16 Social</option>
                                <option value="1:1">1:1 Square</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">Quality</label>
                            <select className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-zinc-300 focus:border-[#D4AF37] outline-none appearance-none">
                                <option>Ultra HD (4k)</option>
                                <option>Standard</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* GENERATE BUTTON */}
                <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt}
                    className="mt-8 w-full py-4 rounded-xl font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:shadow-[0_0_50px_rgba(212,175,55,0.6)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    {loading ? "PROCESSING..." : "GENERATE"}
                </button>
            </aside>

            {/* MAIN VIEWPORT */}
            <main className="flex-1 bg-[#080808] relative flex items-center justify-center p-10 overflow-hidden">
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(to right, #222 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                />

                {/* Content */}
                <div className="relative z-10 w-full h-full max-w-5xl max-h-[80vh] flex items-center justify-center">
                    {!result && !loading && (
                        <div className="text-center opacity-30">
                            <Layers size={64} className="mx-auto mb-4 text-[#D4AF37]" />
                            <h2 className="text-2xl font-bold tracking-widest uppercase">Ready to Create</h2>
                            <p className="text-sm font-mono mt-2">Enter a prompt to ignite the neural engine.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="text-center">
                            <div className="w-20 h-20 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-[0_0_30px_rgba(212,175,55,0.2)]"></div>
                            <h2 className="text-xl font-bold tracking-widest uppercase text-[#D4AF37] animate-pulse">Neural Engine Processing</h2>
                            <p className="text-xs font-mono mt-2 text-zinc-500">Enhancing Prompt... Rendering Assets...</p>
                        </div>
                    )}

                    {result && !loading && (
                        <div className="relative group w-full h-full flex items-center justify-center">
                            {mode === 'image' ? (
                                <img src={result} alt="Generated" className="max-w-full max-h-full rounded shadow-2xl border border-white/10" />
                            ) : (
                                <video src={result} controls className="max-w-full max-h-full rounded shadow-2xl border border-white/10" />
                            )}

                            {/* Actions Overlay */}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-3 bg-black/60 backdrop-blur border border-white/10 rounded-full hover:bg-[#D4AF37] hover:text-black transition-colors" title="Download">
                                    <Download size={20} />
                                </button>
                                <button className="p-3 bg-black/60 backdrop-blur border border-white/10 rounded-full hover:bg-[#D4AF37] hover:text-black transition-colors" title="Upscale">
                                    <Maximize2 size={20} />
                                </button>
                            </div>

                            {/* Enhanced Prompt Display */}
                            {enhancedPrompt && (
                                <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur p-4 rounded-xl border border-white/10 text-xs font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[#D4AF37] font-bold">LUXURY ENHANCEMENT:</span> {enhancedPrompt}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
