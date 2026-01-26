import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

export const Landing = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'checking'>('idle');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');

        try {
            // Check if email already exists
            const { data: existing } = await supabase
                .from('whitelist')
                .select('status')
                .eq('email', email)
                .single();

            if (existing) {
                if (existing.status === 'approved') {
                    // Redirect to login if already approved
                    navigate('/login');
                } else {
                    alert('You are already on the waitlist. Status: ' + existing.status);
                    setStatus('idle');
                }
                return;
            }

            // Insert new
            const { error } = await supabase
                .from('whitelist')
                .insert([{ email }]);

            if (error) throw error;

            setStatus('success');
        } catch (e: any) {
            alert('Error: ' + e.message);
            setStatus('idle');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-yellow-500/30">
            {/* Header */}
            <header className="p-6 md:px-12 flex justify-between items-center">
                <img src="/branding/logo-white.png" alt="MivideoAI" className="h-8" />
                <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                    Login
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 -mt-20">

                <div className="mb-8">
                    <img src="/branding/logo-white.png" alt="MivideoAI" className="h-20 md:h-28" />
                </div>

                <h2 className="text-4xl md:text-6xl font-display font-bold leading-[1.1] mb-6 max-w-4xl mx-auto text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
                    Marketplace de influencers <br />
                    creados con <span className="text-yellow-500">inteligencia artificial</span>
                </h2>

                <p className="text-gray-400 text-lg md:text-xl mb-12 font-light tracking-wide">
                    Crea, compra y vende personajes digitales listos para monetizar.
                </p>

                {/* Form */}
                <div className="w-full max-w-md bg-[#111] border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    {status === 'success' ? (
                        <div className="text-center py-8 animate-fade-in">
                            <div className="text-4xl mb-4">✨</div>
                            <h3 className="text-2xl font-bold text-white mb-2">You are on the list</h3>
                            <p className="text-gray-400">We will notify you when your access is ready.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-6">Acceso Anticipado</p>
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    className="bg-black border border-white/20 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-all text-sm"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="bg-yellow-500 text-black font-bold py-4 rounded-xl hover:bg-yellow-400 transition-transform active:scale-95 text-sm uppercase tracking-wide"
                                >
                                    {status === 'loading' ? 'Joining...' : 'Unirse a la Waitlist →'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </main>

            <footer className="p-8 text-center text-gray-800 text-xs uppercase tracking-widest">
                © 2026 MivideoAI Inc.
            </footer>
        </div>
    );
};
