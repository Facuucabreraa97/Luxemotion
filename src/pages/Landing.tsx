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
            <header className="relative z-10 p-6 md:p-10 flex justify-center md:justify-start items-center max-w-[1800px] mx-auto w-full">
                <img src="/branding/logo-white.png" alt="MivideoAI" className="h-10 md:h-12 object-contain opacity-100 transition-opacity" />
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
                        { img: "/showcase/fashion.png", label: "Fashion", prompt: "IG Story: A fashion influencer selfie, ring light reflection, trendy streetwear, natural skin texture, vertical 9:16." },
                        { img: "/showcase/tech.png", label: "Tech", prompt: "YouTube Review: 4K frame of a tech reviewer holding a new smartphone, RGB studio background, depth of field." },
                        { img: "/showcase/lifestyle.png", label: "Lifestyle", prompt: "Reel: Morning routine aesthetic, drinking matcha latte in a sunlit cafe, casual chic, shot on iPhone 15." },
                        { img: "/showcase/travel.png", label: "Travel", prompt: "Vlog: Golden hour selfie at Santorini, wind in hair, GoPro wide angle style, authentic travel content." }
                    ].map((item, i) => (
                        <div key={i} className={`aspect-[9/16] rounded-xl overflow-hidden relative group cursor-crosshair transform hover:scale-[1.02] transition-transform duration-500 ${i % 2 === 0 ? 'mt-0' : 'mt-12'}`}>
                            <img src={item.img} alt={item.label} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                            {/* Fake UI Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-[10px] font-mono text-white/50 mb-2 uppercase tracking-widest">PROMPT</span>
                                <p className="text-xs font-medium leading-relaxed font-mono text-gray-300">
                                    {item.prompt}
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
