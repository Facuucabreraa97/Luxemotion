
import React, { useState } from 'react';
import { MarketService } from '@/services/market.service';
import { supabase } from '@/lib/supabase';

export const Studio = ({ credits, setCredits }: any) => {
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'MINTING'>('IDLE');
    const [supply, setSupply] = useState(1);
    const [price, setPrice] = useState(0);

    const handleCreate = async () => {
        if (!prompt) return;
        // if (credits < 50) return alert("Necesitas 50 CR para crear."); // Credits check commented out if credits prop isn't passed yet or we handle it differently

        setStatus('PROCESSING');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

            // Simular Generación
            await new Promise(r => setTimeout(r, 2000));

            setStatus('MINTING');

            // Guardar en DB
            await MarketService.mintAsset({
                name: prompt.substring(0, 20),
                description: prompt,
                image_url: 'https://via.placeholder.com/500',
                price: price,
                supply_total: supply,
                royalty_percent: 5
            }, user.id);

            if (setCredits) setCredits((prev: number) => prev - 50);
            alert("¡Activo creado y guardado en tu Wallet!");
            setPrompt('');
            setStatus('IDLE');

        } catch (e: any) {
            alert("Error: " + e.message);
            setStatus('IDLE');
        }
    };

    return (
        <div className="max-w-6xl mx-auto h-full flex flex-col gap-6 animate-in fade-in text-white p-8">
            <header>
                <h2 className="text-4xl font-bold tracking-tighter">Studio Creator</h2>
                <p className="text-gray-400">Diseña, Genera y Acuña tu Influencer IA.</p>
            </header>

            <div className="grid lg:grid-cols-2 gap-8 h-full">
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Prompt</label>
                        <textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            disabled={status !== 'IDLE'}
                            className="w-full h-32 bg-transparent text-white text-lg outline-none resize-none placeholder-gray-600"
                            placeholder="Describe a tu influencer..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                            <label className="text-xs text-gray-500 uppercase block">Supply</label>
                            <input type="number" value={supply} onChange={e => setSupply(Number(e.target.value))} className="bg-transparent text-white font-bold w-full mt-1 outline-none" />
                        </div>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                            <label className="text-xs text-gray-500 uppercase block">Precio (CR)</label>
                            <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="bg-transparent text-white font-bold w-full mt-1 outline-none" />
                        </div>
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={status !== 'IDLE' || !prompt}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${status === 'IDLE' ? 'bg-white text-black hover:scale-[1.02]' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {status === 'IDLE' ? 'Generar & Acuñar (-50 CR)' : status === 'PROCESSING' ? 'Generando...' : 'Guardando...'}
                    </button>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-3xl flex items-center justify-center relative overflow-hidden min-h-[400px]">
                    <span className="text-6xl">🎨</span>
                </div>
            </div>
        </div>
    );
};