import React, { useState } from 'react';
import { useToast } from '@/modules/core/ui/Toast';

export const Studio = () => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleGen = () => {
        if (!prompt) return toast("Enter a prompt first", 'error');
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast("Creation initiated!", 'success');
        }, 1500);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <header>
                <h1 className="text-3xl font-bold mb-2">Create New Video</h1>
                <p className="text-gray-400">Transform your text into cinematic motion.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#0f0f0f] border border-white/5 p-6 rounded-2xl">
                        <label className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-4 block">Prompt</label>
                        <textarea 
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors h-40 resize-none" 
                            placeholder="A futuristic city with neon lights..."
                        />
                        <button 
                            onClick={handleGen}
                            disabled={loading}
                            className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all"
                        >
                            {loading ? 'Generating...' : 'Generate Video'}
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="aspect-video bg-[#0f0f0f] border border-white/5 rounded-2xl flex items-center justify-center text-gray-600">
                        <span className="text-sm">Preview Output</span>
                    </div>
                    
                    <div className="mt-8">
                        <h3 className="text-lg font-bold mb-4">Recent Creations</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[1,2,3].map(i => (
                                <div key={i} className="aspect-[9/16] bg-[#0f0f0f] rounded-xl border border-white/5 hover:border-white/20 transition-all cursor-pointer" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};