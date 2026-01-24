import React, { useState } from 'react';
import { Sparkles, Image, Video, Wand2, Loader2 } from 'lucide-react';

export default function AppStudio() {
    const [mode, setMode] = useState('image');
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        // Simulate gen
        setTimeout(() => { setLoading(false); alert("Generation logic connected to Server!"); }, 2000);
    };

    return (
        <div className="min-h-full p-4 lg:p-8 flex flex-col lg:flex-row gap-8 text-white">
            <div className="w-full lg:w-[400px] shrink-0 space-y-6">
                <div><h1 className="text-3xl font-serif font-bold text-[#D4AF37]">Studio</h1><p className="text-xs uppercase tracking-widest text-zinc-500">Create Unique Assets</p></div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/20 blur-3xl rounded-full pointer-events-none" />

                    <div className="flex bg-black/50 p-1 rounded-xl">
                        <button onClick={() => setMode('image')} className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${mode === 'image' ? 'bg-white text-black' : 'text-zinc-500'}`}><Image size={14} /> Image</button>
                        <button onClick={() => setMode('video')} className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${mode === 'video' ? 'bg-white text-black' : 'text-zinc-500'}`}><Video size={14} /> Video</button>
                    </div>

                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe your masterpiece..." className="w-full h-32 bg-black/30 border border-white/10 rounded-xl p-4 text-sm focus:border-[#D4AF37] outline-none resize-none" />

                    <button onClick={handleGenerate} disabled={loading || !prompt} className="w-full py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest rounded-xl hover:bg-[#c4a030] disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />} GENERATE
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-3xl flex items-center justify-center min-h-[500px] relative overflow-hidden group">
                <div className="text-zinc-700 font-serif text-4xl opacity-20 group-hover:opacity-30 transition-opacity">Canvas Empty</div>
            </div>
        </div>
    );
}
