import React, { useState, useEffect } from 'react';
import { useMode } from '../context/ModeContext';
import { supabase } from '@/lib/supabase';
import {
    Sparkles, Upload, Image as ImageIcon, Zap, Command,
    Maximize2, Mic, History, Play, Check
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';

// Mock Types
interface Talent {
    id: string;
    name: string;
    avatar_url: string;
}

interface Generation {
    id: string;
    url: string;
    prompt: string;
    timestamp: Date;
}

// Mock Data for Col 3
const RECENT_GENS: Generation[] = [
    { id: '1', url: 'https://placehold.co/600x400/1a1a1a/FFF?text=Video+1', prompt: 'Cinematic lighting...', timestamp: new Date() },
    { id: '2', url: 'https://placehold.co/600x400/1a1a1a/FFF?text=Video+2', prompt: 'Closeup shot...', timestamp: new Date() }
];

interface StudioConsoleProps {
    credits: number;
    setCredits: React.Dispatch<React.SetStateAction<number>>;
    notify: (msg: string) => void;
}

export const StudioConsole: React.FC<StudioConsoleProps> = ({ credits, setCredits, notify }) => {
    const { mode } = useMode();
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [talents, setTalents] = useState<Talent[]>([]);
    const [selectedTalent, setSelectedTalent] = useState<string | null>(null);

    // Fetch Talents
    useEffect(() => {
        const fetchTalents = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('talents').select('*').eq('user_id', user.id);
                if (data) setTalents(data);
            }
        };
        fetchTalents();
    }, []);

    const handleGenerate = () => {
        if (credits < 5) {
            notify("Insufficient credits!");
            return;
        }

        setIsGenerating(true);

        // Mock Generation Process
        setTimeout(() => {
            setIsGenerating(false);
            setCredits(prev => prev - 5);
            notify("Generation Complete! (-5 Credits)");
        }, 3000);
    };

    // Velvet vs Agency Styles
    const isVelvet = mode === 'velvet';
    const bgClass = isVelvet ? 'bg-[#030303]' : 'bg-gray-50';
    const textClass = isVelvet ? 'text-white' : 'text-gray-900';
    const borderClass = isVelvet ? 'border-[#C6A649]/30' : 'border-gray-200';
    const accentColor = isVelvet ? '#C6A649' : '#3B82F6';
    const fontFamily = isVelvet ? 'font-serif' : 'font-sans';

    return (
        <div className={`min-h-screen p-4 lg:p-8 ${bgClass} ${textClass} ${fontFamily} transition-colors duration-500`}>

            {}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Studio Console</h1>
                    <p className={`text-sm opacity-60 uppercase tracking-widest ${isVelvet ? 'text-[#C6A649]' : 'text-blue-500'}`}>
                        {isVelvet ? 'Private Suite' : 'Creative Director Mode'}
                    </p>
                </div>
                <div className={`px-4 py-2 rounded-full border ${borderClass} flex items-center gap-2`}>
                    <Zap size={14} fill={accentColor} color={accentColor} />
                    <span className="font-mono font-bold">{credits} Credits</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">

                {}
                <div className="lg:col-span-3 space-y-6 flex flex-col h-full overflow-y-auto pr-2">

                    {}
                    <div id="studio-source-upload" className="relative group">
                        <GlassCard className={`p-6 border ${borderClass} relative overflow-hidden group-hover:border-opacity-100 transition-all`}>
                            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 opacity-70 flex items-center gap-2">
                                <ImageIcon size={14} /> Source Model
                            </h3>

                            {talents.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {talents.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setSelectedTalent(t.id)}
                                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                                                ${selectedTalent === t.id ? `border-[${accentColor}]` : 'border-transparent opacity-50 hover:opacity-100'}`}
                                        >
                                            <img src={t.avatar_url || 'https://placehold.co/100'} alt={t.name} className="w-full h-full object-cover" />
                                            {selectedTalent === t.id && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <Check size={16} color="white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                    <button className={`aspect-square rounded-lg border-2 border-dashed ${borderClass} flex flex-col items-center justify-center opacity-50 hover:opacity-100 hover:bg-white/5 transition-all`}>
                                        <Upload size={20} />
                                        <span className="text-[9px] uppercase mt-2 font-bold">New</span>
                                    </button>
                                </div>
                            ) : (
                                <div className={`aspect-video rounded-xl border-2 border-dashed ${borderClass} flex flex-col items-center justify-center p-8 text-center`}>
                                    <Upload className="mb-4 opacity-50" size={32} />
                                    <p className="text-xs font-bold opacity-70">No models found</p>
                                    <p className="text-[10px] opacity-40 mt-1">Upload a face to start</p>
                                </div>
                            )}
                        </GlassCard>
                    </div>

                    {}
                    {!isVelvet && (
                        <div id="studio-product-upload">
                            <GlassCard className={`p-6 border ${borderClass}`}>
                                <h3 className="text-xs font-bold uppercase tracking-widest mb-4 opacity-70 flex items-center gap-2">
                                    <Command size={14} /> Product Reference
                                </h3>
                                <div className={`h-32 rounded-xl border-2 border-dashed ${borderClass} flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-white/5 transition-all`}>
                                    <Upload className="mb-2 opacity-50" size={24} />
                                    <p className="text-[10px] font-bold opacity-70">Drop Image Here</p>
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </div>

                {}
                <div className="lg:col-span-6 flex flex-col gap-6 h-full">
                    <GlassCard className={`flex-1 border ${borderClass} relative overflow-hidden flex flex-col p-1`}>
                        {}
                        <div className={`flex-1 rounded-xl ${isVelvet ? 'bg-black/50' : 'bg-gray-100'} flex items-center justify-center relative`}>
                            {isGenerating ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                                    <Sparkles className={`w-12 h-12 animate-spin mb-4 text-[${accentColor}]`} />
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] animate-pulse">Rendering Reality...</p>
                                </div>
                            ) : (
                                <div className="text-center opacity-30">
                                    <Maximize2 className="mx-auto mb-4" size={48} />
                                    <p className="text-sm font-medium uppercase tracking-widest">Preview Canvas</p>
                                </div>
                            )}
                        </div>

                        {}
                        <div className="p-6">
                            <div className="relative">
                                <textarea
                                    className={`w-full h-32 rounded-xl p-4 pr-12 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[${accentColor}] transition-all
                                        ${isVelvet ? 'bg-white/5 border border-white/10 text-white placeholder-white/30' : 'bg-white border border-gray-200 placeholder:text-gray-400'}`}
                                    placeholder={isVelvet ? "Describe your private fantasy..." : "Describe the commercial scene, lighting, and camera angle..."}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                />
                                <button className="absolute right-3 bottom-3 p-2 rounded-full hover:bg-white/10 transition-colors opacity-50 hover:opacity-100">
                                    <Mic size={16} />
                                </button>
                            </div>

                            <div className="mt-4 flex justify-between items-center">
                                <div className="flex gap-2">
                                    {['16:9', '9:16', '1:1'].map(ratio => (
                                        <button key={ratio} className={`px-3 py-1 rounded text-[10px] font-bold border transition-colors ${borderClass} hover:bg-white/5`}>
                                            {ratio}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    id="studio-generate-btn"
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !prompt}
                                    className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all duration-300 relative z-20
                                        ${isVelvet
                                            ? 'bg-[#C6A649] text-black shadow-[0_0_15px_rgba(198,166,73,0.5)] hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(198,166,73,0.8)] border-none'
                                            : 'bg-black text-white hover:bg-gray-800 shadow-lg'}`}
                                >
                                    {isGenerating ? 'Envisioning...' : 'Generate'}
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {}
                <div className="lg:col-span-3 h-full overflow-y-auto pl-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-4 opacity-70 flex items-center gap-2">
                        <History size={14} /> Recent Dreams
                    </h3>
                    <div className="space-y-4">
                        {RECENT_GENS.map(gen => (
                            <GlassCard key={gen.id} className={`p-0 overflow-hidden group border ${borderClass} hover:border-opacity-100 transition-all`}>
                                <div className="relative aspect-video">
                                    <img src={gen.url} alt="Gen" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Play fill="white" className="text-white" />
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-[10px] opacity-70 line-clamp-2 leading-relaxed">
                                        {gen.prompt}
                                    </p>
                                    <p className="text-[9px] opacity-40 mt-2 font-mono">
                                        {gen.timestamp.toLocaleTimeString()}
                                    </p>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudioConsole;
