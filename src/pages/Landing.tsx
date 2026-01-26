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
        <div className="min-h-screen bg-[#000] text-white flex flex-col font-sans selection:bg-white selection:text-black overflow-x-hidden">

            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[20%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] mix-blend-screen animate-pulse-slower" />
            </div>

            {/* Header */}
            <header className="relative z-10 p-6 md:p-10 flex justify-between items-center max-w-[1800px] mx-auto w-full">
                <div className="flex items-center gap-2">
                    <img src="/branding/logo-white.png" alt="MivideoAI" className="h-6 object-contain opacity-90 hover:opacity-100 transition-opacity" />
                </div>
                <button onClick={() => navigate('/login')} className="bg-white/10 hover:bg-white/20 px-5 py-2 rounded-full text-xs font-medium transition-all backdrop-blur-md border border-white/5">
                    Log in
                </button>
            </header>

            {/* Hero Section */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-32">

                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h1 className="text-6xl md:text-8xl font-medium tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 animate-fade-in-up">
                        Creating influencers <br /> from text.
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 font-light max-w-xl mx-auto tracking-wide animate-fade-in-up delay-100">
                        MivideoAI is a marketplace for digital humans. <br className="hidden md:block" />
                        Generate, monetize, and own the next generation of fame.
                    </p>

                    {/* Waitlist Input */}
                    <div className="w-full max-w-md mx-auto mt-12 animate-fade-in-up delay-200">
                        {status === 'success' ? (
                            <div className="bg-white/5 border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded-full backdrop-blur-xl flex items-center justify-center gap-3">
                                <span className="text-xl">✨</span>
                                <span className="font-medium tracking-wide">You're on the list. We'll be in touch.</span>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                                <div className="relative flex bg-black rounded-full border border-white/10 p-1.5 focus-within:border-white/30 transition-colors">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="Enter your email to join..."
                                        className="bg-transparent flex-1 pl-6 pr-4 text-white placeholder-gray-500 focus:outline-none text-base font-light"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
                                    >
                                        {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
                                    </button>
                                </div>
                            </form>
                        )}
                        <p className="mt-4 text-xs text-gray-600 font-medium tracking-widest uppercase">
                            Limited Alpha Release 2026
                        </p>
                    </div>
                </div>

                {/* Grid Showcase (Sora Style) */}
                <div className="mt-32 w-full max-w-[1600px] grid grid-cols-2 md:grid-cols-4 gap-4 px-4 opacity-40 hover:opacity-100 transition-opacity duration-700">
                    {[
                        { color: "from-pink-500 to-rose-500", label: "Fashion" },
                        { color: "from-blue-500 to-cyan-500", label: "Tech" },
                        { color: "from-emerald-500 to-teal-500", label: "Lifestyle" },
                        { color: "from-orange-500 to-amber-500", label: "Travel" }
                    ].map((item, i) => (
                        <div key={i} className={`aspect-[9/16] rounded-xl overflow-hidden relative group cursor-crosshair transform hover:scale-[1.02] transition-transform duration-500 ${i % 2 === 0 ? 'mt-0' : 'mt-12'}`}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
                            {/* Fake UI Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                                <span className="text-xs font-mono text-white/70 mb-1">PROMPT</span>
                                <p className="text-sm font-medium leading-snug">
                                    A photorealistic AI influencer specializing in {item.label.toLowerCase()}, 8k resolution, cinematic lighting.
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

            </main>

            <footer className="p-10 text-center relative z-10 border-t border-white/5">
                <p className="text-gray-600 text-xs hover:text-gray-400 transition-colors cursor-pointer">
                    MivideoAI Inc. © 2026 &nbsp;&nbsp;•&nbsp;&nbsp; Terms &nbsp;&nbsp;•&nbsp;&nbsp; Privacy
                </p>
            </footer>

            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { transform: scale(1); opacity: 0.1; }
                    50% { transform: scale(1.1); opacity: 0.15; }
                }
                .animate-pulse-slow { animation: pulse-slow 8s infinite ease-in-out; }
                .animate-pulse-slower { animation: pulse-slow 12s infinite ease-in-out reverse; }
                .animate-fade-in-up { animation: fadeInUp 1s ease-out forwards; opacity: 0; transform: translateY(20px); }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                @keyframes fadeInUp {
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
