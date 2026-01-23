import React, { useState, useEffect } from 'react';
import { Sparkles, Image as ImageIcon, Video, Loader2, Download, Maximize2, Layers, Wand2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface Generation { id: string; url: string; type: 'image' | 'video'; prompt: string; created_at: string; }

export default function AppStudio() {
    const [mode, setMode] = useState<'image' | 'video'>('image');
    const [prompt, setPrompt] = useState('');
    const [aspect, setAspect] = useState('16:9');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [credits, setCredits] = useState<number>(0);
    const [history, setHistory] = useState<Generation[]>([]);

    const COST = mode === 'image' ? 1 : 15;

    useEffect(() => { fetchUserData(); fetchHistory(); }, []);

    const fetchUserData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
            if (data) setCredits(data.credits);
        }
    };

    const fetchHistory = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('generations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6);
            if (data) setHistory(data as Generation[]);
        }
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        if (credits < COST) { alert(`Insufficient Balance. Need ${COST} CR.`); return; }

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/studio/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode, prompt, aspectRatio: aspect })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Success
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.rpc('add_credits', { user_id: user.id, amount: -COST });
                await supabase.from('generations').insert({ user_id: user.id, url: data.outputUrl, type: mode, prompt });
                setResult(data.outputUrl);
                fetchUserData();
                fetchHistory();
            }
        } catch (e) { alert("Error: " + (e as Error).message); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-full bg-[#050505] text-white p-4 lg:p-8 pb-32 lg:pb-8 flex flex-col lg:flex-row gap-6 lg:gap-10">

            {/* --- LEFT PANEL: CONTROLS --- */}
            <div className="w-full lg:w-[380px] flex flex-col gap-6 shrink-0 animate-in slide-in-from-left duration-500">

                {/* HEADER */}
                <div>
                    <h1 className="text-3xl font-serif font-bold text-[#E5E5E5] tracking-wider mb-1">Studio</h1>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-bold">Generative Suite V3</p>
                </div>

                {/* GLASS CARD CONTAINER */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                    {/* Glow Effect */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    {/* TABS */}
                    <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
                        <button onClick={() => setMode('image')} className={cn("flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2", mode === 'image' ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white")}>
                            <ImageIcon size={14} /> Image
                        </button>
                        <button onClick={() => setMode('video')} className={cn("flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2", mode === 'video' ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white")}>
                            <Video size={14} /> Video
                        </button>
                    </div>

                    {/* PROMPT INPUT */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">Prompt</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={mode === 'image' ? "A futuristic luxury villa on a cliff..." : "Cinematic slow motion of a golden watch..."}
                            className="w-full h-32 bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/30 transition-all resize-none"
                        />
                    </div>

                    {/* SETTINGS */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">Aspect</label>
                            <select value={aspect} onChange={(e) => setAspect(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-zinc-300 focus:border-[#D4AF37] outline-none">
                                <option value="16:9">16:9 Cinema</option>
                                <option value="9:16">9:16 Vertical</option>
                                <option value="1:1">1:1 Square</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">Cost</label>
                            <div className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-[#D4AF37] font-mono flex items-center justify-between">
                                <span>{COST} CR</span>
                                <span className="text-zinc-600 text-[10px]">/ GEN</span>
                            </div>
                        </div>
                    </div>

                    {/* GENERATE BUTTON */}
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt || credits < COST}
                        className="mt-2 w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 group"
                    >
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
                        {loading ? "PROCESSING..." : "GENERATE"}
                    </button>

                    {/* BALANCE MINI */}
                    <div className="text-center">
                        <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Balance: <span className="text-[#D4AF37]">{credits} CR</span></span>
                    </div>
                </div>
            </div>

            {/* --- RIGHT PANEL: PREVIEW & HISTORY --- */}
            <div className="flex-1 flex flex-col gap-6 h-full min-h-[500px] animate-in slide-in-from-right duration-500 delay-100">

                {/* MAIN CANVAS */}
                <div className="flex-1 bg-[#080808] border border-white/5 rounded-3xl relative overflow-hidden flex items-center justify-center group shadow-2xl">
                    {/* Grid Pattern */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(to right, #222 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                    {!result && !loading && (
                        <div className="text-center opacity-20">
                            <Layers size={64} className="mx-auto mb-4 text-[#D4AF37]" />
                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-white">Canvas Ready</p>
                        </div>
                    )}

                    {loading && (
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-20 h-20 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mb-6" />
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37] animate-pulse">Neural Rendering...</p>
                        </div>
                    )}

                    {result && !loading && (
                        <div className="relative w-full h-full p-4 lg:p-10 flex items-center justify-center">
                            {mode === 'image' ? (
                                <img src={result} className="max-w-full max-h-full rounded-lg shadow-2xl object-contain border border-white/10" />
                            ) : (
                                <video src={result} controls autoPlay loop className="max-w-full max-h-full rounded-lg shadow-2xl border border-white/10" />
                            )}

                            <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a href={result} download target="_blank" className="p-3 bg-black/60 backdrop-blur rounded-full hover:bg-white hover:text-black transition-colors border border-white/10"><Download size={18} /></a>
                                <button onClick={() => window.open(result, '_blank')} className="p-3 bg-black/60 backdrop-blur rounded-full hover:bg-white hover:text-black transition-colors border border-white/10"><Maximize2 size={18} /></button>
                            </div>
                        </div>
                    )}
                </div>

                {/* HISTORY STRIP */}
                <div className="h-28 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {history.map((gen) => (
                        <div key={gen.id} onClick={() => setResult(gen.url)} className="min-w-[160px] h-full rounded-xl bg-zinc-900 border border-white/5 relative overflow-hidden group cursor-pointer hover:border-[#D4AF37]/50 transition-colors">
                            {gen.type === 'image' ? (
                                <img src={gen.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <video src={gen.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            )}
                            <div className="absolute bottom-0 w-full p-2 bg-gradient-to-t from-black/90 to-transparent">
                                <p className="text-[8px] text-white/70 truncate font-mono">{gen.prompt}</p>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
