import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { S } from '../styles';

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-purple-500/30">
            {/* Nav (Minimal) */}
            <nav className="p-8 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="text-xl font-bold tracking-tight">LUXEMOTION</div>
                <button onClick={() => navigate('/login')} className="text-xs font-bold uppercase tracking-widest hover:text-purple-400 transition-colors">
                    Login
                </button>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
                {/* Background Glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 space-y-8 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur text-[10px] font-bold uppercase tracking-widest animate-in fade-in zoom-in duration-1000 delay-100">
                        <Sparkles size={10} className="text-purple-400" />
                        <span>VydyLabs Engine v2.0</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        The New Era of<br />Video Generation.
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 font-light tracking-wide max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                        Create. Scale. Monetize. <br />
                        Join the private network of elite creators.
                    </p>

                    <div className="pt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400">
                        <button
                            onClick={() => navigate('/register')}
                            className="group relative px-8 py-4 bg-white text-black rounded-full font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)]"
                        >
                            Request Access
                            <ArrowRight className="inline-block ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <p className="mt-4 text-[10px] text-gray-600 uppercase tracking-widest">
                            Limited Spots Available
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="p-8 text-center animate-in fade-in duration-1000 delay-700">
                <p className="text-[10px] text-gray-700 font-mono tracking-widest uppercase">
                    Powered by VydyLabs © 2026
                </p>
            </footer>
        </div>
    );
};
