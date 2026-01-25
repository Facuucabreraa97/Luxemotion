
import React, { useState } from 'react';
import { MarketService } from '@/services/market.service';
import { supabase } from '@/lib/supabase';

// Reusing the same props logic but with upgraded UI
export const Studio = ({ credits, setCredits }: any) => {
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'MINTING'>('IDLE');
    const [supply, setSupply] = useState(1);
    const [price, setPrice] = useState(0);

    const handleCreate = async () => {
        if (!prompt) return;
        setStatus('PROCESSING');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Fallback for demo/dev mode if auth fails or isn't set up
                console.warn("User not authenticated, proceeding in demo mode");
            }

            // Simulate AI Generation with a "Thinking" delay
            await new Promise(r => setTimeout(r, 2500));

            setStatus('MINTING');

            // If user is real, save to DB
            if (user) {
                await MarketService.mintAsset({
                    name: prompt.substring(0, 30),
                    description: prompt,
                    image_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop', // Temporary cool placeholder
                    price: price,
                    supply_total: supply,
                    royalty_percent: 5
                }, user.id);
            }

            if (setCredits) setCredits((prev: number) => prev - 50);
            setPrompt('');
            setStatus('IDLE');

        } catch (e: any) {
            alert("Error: " + e.message);
            setStatus('IDLE');
        }
    };

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col gap-8 animate-slide-up text-white p-6 md:p-10">
            <header className="flex flex-col gap-2">
                <h2 className="text-5xl md:text-6xl font-display font-medium tracking-tight text-white mb-2">
                    Creation Studio
                </h2>
                <p className="text-xl text-gray-400 font-light max-w-2xl">
                    Craft cinematic experiences with Luxemotion AI. Your imagination, rendered in real-time.
                </p>
            </header>

            <div className="grid lg:grid-cols-12 gap-8 h-full min-h-[600px]">
                {/* Left Control Panel */}
                <div className="lg:col-span-5 space-y-6 flex flex-col">
                    <div className="glass-panel p-6 rounded-3xl flex-1 flex flex-col transition-all duration-500 hover:bg-white/5">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 block">
                            Prompt Engineering
                        </label>
                        <textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            disabled={status !== 'IDLE'}
                            className="w-full flex-1 bg-transparent text-white text-xl md:text-2xl font-light outline-none resize-none placeholder-gray-700 leading-relaxed"
                            placeholder="Describe a scene of a cybernetic warrior in a neon-lit rain..."
                        />

                        <div className="flex justify-between items-center text-xs text-gray-600 font-mono pt-4 border-t border-white/5 mt-4">
                            <span>AI MODEL: LUX-V4</span>
                            <span>{prompt.length} CHARS</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-panel p-5 rounded-2xl">
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Supply Cap</label>
                            <input
                                type="number"
                                value={supply}
                                onChange={e => setSupply(Number(e.target.value))}
                                className="bg-transparent text-2xl font-display font-medium text-white w-full outline-none"
                            />
                        </div>
                        <div className="glass-panel p-5 rounded-2xl">
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Listing Price (CR)</label>
                            <input
                                type="number"
                                value={price}
                                onChange={e => setPrice(Number(e.target.value))}
                                className="bg-transparent text-2xl font-display font-medium text-white w-full outline-none"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={status !== 'IDLE' || !prompt}
                        className={`w-full py-5 rounded-2xl font-medium text-lg tracking-wide transition-all duration-300 shadow-2xl ${status === 'IDLE'
                                ? 'bg-white text-black hover:scale-[1.01] hover:shadow-white/20'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {status === 'IDLE' ? 'Generate Asset' : status === 'PROCESSING' ? 'Processing...' : 'Minting Protocol...'}
                    </button>
                </div>

                {/* Right Preview Area */}
                <div className="lg:col-span-7">
                    <div className={`w-full h-full min-h-[500px] glass-panel rounded-3xl flex items-center justify-center relative overflow-hidden group transition-all duration-700 ${status === 'PROCESSING' ? 'border-accent/50 shadow-accent/20 shadow-2xl' : ''}`}>
                        {status === 'IDLE' && (
                            <div className="text-center opacity-30 group-hover:opacity-50 transition-opacity">
                                <div className="text-7xl mb-4 grayscale">💠</div>
                                <p className="font-light tracking-widest uppercase text-sm">Preview Viewport</p>
                            </div>
                        )}

                        {status === 'PROCESSING' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                                <div className="w-16 h-16 border-4 border-t-accent border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-6"></div>
                                <p className="text-accent font-mono text-sm animate-pulse tracking-widest">RENDERING FRAMES...</p>
                            </div>
                        )}

                        {/* Decorative background gradients */}
                        <div className="absolute -top-[200px] -right-[200px] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
                        <div className="absolute -bottom-[200px] -left-[200px] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
    );
};