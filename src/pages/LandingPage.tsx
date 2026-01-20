import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Hexagon } from 'lucide-react';

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white/20 relative overflow-hidden">

            {/* AMBIENT BACKGROUND (No Images, Pure Code) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black pointer-events-none"></div>
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            {/* NAV */}
            <nav className="relative z-10 p-8 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="flex items-center gap-2">
                    <Hexagon size={16} className="text-white fill-white/10" />
                    <span className="text-sm font-bold tracking-[0.2em]">MivideoAI</span>
                </div>
                <button onClick={() => navigate('/login')} className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors">
                    Login
                </button>
            </nav>

            {/* HERO */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">

                {/* Badge */}
                <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-md animate-in fade-in zoom-in duration-1000 delay-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">VydyLabs Engine v2.0 Live</span>
                </div>

                {/* Logo Image */}
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                    <img src="/branding/logo-white.png" alt="MivideoAI" className="h-20 md:h-24 lg:h-32 w-auto mx-auto object-contain" />
                </div>

                {/* Subtitle */}
                <p className="max-w-xl mx-auto text-xl md:text-2xl text-zinc-400 font-light tracking-wide mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
                    Acceso Exclusivo.<br />
                    <span className="text-white font-medium">El Futuro es Ahora.</span>
                </p>

                {/* CTA Button: Pale Gold / White */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700">
                    <button
                        onClick={() => navigate('/register')}
                        className="group relative px-10 py-5 bg-white text-black rounded-full transition-all duration-300 hover:scale-105 hover:bg-[#F0EAD6]" // Pale gold hint
                    >
                        <div className="absolute inset-0 rounded-full bg-white blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <span className="relative text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                            SOLICITAR ACCESO
                            <ArrowRight size={14} />
                        </span>
                    </button>
                    <p className="mt-6 text-[9px] text-zinc-700 uppercase tracking-[0.3em] font-mono">
                        Application Required
                    </p>
                </div>
            </main>

            {/* FOOTER */}
            <footer className="relative z-10 p-8 text-center animate-in fade-in duration-1000 delay-1000">
                <div className="inline-flex flex-col items-center gap-2">
                    <div className="w-px h-8 bg-gradient-to-b from-transparent via-zinc-800 to-transparent"></div>
                    <p className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase">
                        Powered by VydyLabs © 2026
                    </p>
                </div>
            </footer>
        </div>
    );
};
