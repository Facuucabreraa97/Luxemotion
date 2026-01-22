import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Hexagon } from 'lucide-react';

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white/20 relative overflow-hidden">

            {}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black pointer-events-none"></div>
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            {}
            <nav className="relative z-10 p-8 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="flex items-center gap-2">
                    <Hexagon size={16} className="text-white fill-white/10" />
                    <span className="text-sm font-bold tracking-[0.2em]">MivideoAI</span>
                </div>
                <button onClick={() => navigate('/login')} className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors">
                    Login
                </button>
            </nav>

            {}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">

                {}
                <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-md animate-in fade-in zoom-in duration-1000 delay-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">VydyLabs Engine v2.0 Live</span>
                </div>

                {}
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                    <img src="/branding/logo-white.png" alt="MivideoAI" className="h-20 md:h-24 lg:h-32 w-auto mx-auto object-contain" />
                </div>

                {}
                <p className="max-w-xl mx-auto text-xl md:text-2xl text-zinc-400 font-light tracking-wide mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
                    Acceso Exclusivo.<br />
                    <span className="text-white font-medium">El Futuro es Ahora.</span>
                </p>

                {}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700 mb-20">
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

                {}
                <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-1000">

                    {}
                    <div className="p-8 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-sm hover:border-[#C6A649]/50 hover:-translate-y-1 transition-all duration-300 group text-left">
                        <div className="w-12 h-12 rounded-full bg-black border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Sparkles className="text-white w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">Generación de Activos</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Transforma texto en video cinematográfico con nuestro motor <span className="text-white">VydyLabs Engine v2.0</span>.
                        </p>
                    </div>

                    {}
                    <div className="p-8 rounded-3xl border border-[#C6A649]/20 bg-gradient-to-b from-[#C6A649]/10 to-transparent backdrop-blur-sm hover:border-[#C6A649]/50 hover:-translate-y-1 transition-all duration-300 group text-left relative overflow-hidden">
                        <div className="absolute inset-0 bg-yellow-500/5 blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative z-10 w-12 h-12 rounded-full bg-black border border-[#C6A649]/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            {}
                            <Sparkles className="text-[#C6A649] w-5 h-5 hidden" /> {}
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C6A649" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" /></svg>
                        </div>
                        <h3 className="relative z-10 text-lg font-bold text-white mb-4 uppercase tracking-wider">Marketplace Descentralizado</h3>
                        <p className="relative z-10 text-sm text-zinc-300 leading-relaxed">
                            Compra y vende derechos de propiedad intelectual. Adquiere videos virales y hazlos tuyos.
                        </p>
                    </div>

                    {}
                    <div className="p-8 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-sm hover:border-[#C6A649]/50 hover:-translate-y-1 transition-all duration-300 group text-left">
                        <div className="w-12 h-12 rounded-full bg-black border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">Monetización de Portfolio</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Cada activo es una fuente de ingresos. Gestiona tu cartera y escala tus ganancias (CR).
                        </p>
                    </div>
                </div>

                {}
                <div className="mt-20 mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-1000">
                    <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-[0.4em]">
                        EL PRIMER MERCADO DE VALORES DE VIDEO IA DEL MUNDO.
                    </p>
                </div>

            </main>

            {}
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
