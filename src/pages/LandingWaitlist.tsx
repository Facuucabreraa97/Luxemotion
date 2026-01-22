import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Hexagon, Check, Loader2 } from 'lucide-react';

export const LandingWaitlist = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!validateEmail(email)) {
            setErrorMsg('Por favor ingresa un email válido.');
            return;
        }

        setStatus('loading');

        try {
            // Mock backend connection
            await new Promise(resolve => setTimeout(resolve, 1000));
            setStatus('success');
            setEmail('');
        } catch (err) {
            setStatus('error');
            setErrorMsg('Hubo un error. Intenta nuevamente.');
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-gray-100 font-sans selection:bg-purple-500/30 flex flex-col relative overflow-hidden">

            {/* Background Effects */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none z-0" />

            {/* HERO SECTION */}
            <header className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-12 pb-20 flex flex-col items-center text-center">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-12 self-start md:self-center">
                    <Hexagon size={24} className="text-white fill-white" />
                    <span className="text-xl font-bold tracking-tight text-white">MivideoAI</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight mb-8 max-w-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                    Marketplace de influencers creados con inteligencia artificial
                </h1>
                <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mb-12 font-light">
                    Crea, compra y vende personajes digitales listos para monetizar.
                </p>
                <button
                    onClick={() => document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group px-8 py-4 bg-white text-black rounded-full font-bold text-lg tracking-wide hover:bg-gray-200 hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                    Unirse a la Waitlist
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </header>

            {/* VALUE PROPOSITION: Problem/Solution */}
            <section className="relative z-10 w-full border-y border-white/10 bg-black/20 backdrop-blur-sm py-20">
                <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Problem */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">El Problema</h3>
                        <p className="text-lg font-medium text-gray-300 leading-relaxed">
                            No existe una plataforma que permita crear un influencer completo de forma fácil y rápida. Las herramientas actuales son complejas y fragmentadas.
                        </p>
                    </div>
                    {/* Solution */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-4">La Solución</h3>
                        <p className="text-lg font-medium text-gray-300 leading-relaxed">
                            Una plataforma de inteligencia artificial que genera influencers virtuales listos para producir, publicar y vender contenido de forma automática.
                        </p>
                    </div>
                </div>
            </section>

            {/* WAITLIST MECHANISM */}
            <section id="waitlist-form" className="relative z-10 w-full py-24 px-6 flex flex-col items-center">
                <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
                    <h2 className="text-2xl font-bold text-center mb-2 text-white">Acceso Anticipado</h2>
                    <p className="text-center text-gray-400 mb-8 text-sm">Sé el primero en acceder al marketplace.</p>

                    {status === 'success' ? (
                        <div className="p-6 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex flex-col items-center animate-in fade-in zoom-in">
                            <Check size={32} className="mb-2" />
                            <h3 className="font-bold text-lg">¡Estás en la lista!</h3>
                            <button onClick={() => setStatus('idle')} className="mt-4 text-xs underline opacity-60 hover:opacity-100">
                                Registrar otro
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    className="w-full px-4 py-3 bg-black/50 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-600"
                                    disabled={status === 'loading'}
                                />
                                {errorMsg && <p className="text-red-400 text-xs mt-2">{errorMsg}</p>}
                            </div>
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:scale-[1.02] transition-all disabled:opacity-50"
                            >
                                {status === 'loading' ? <Loader2 size={20} className="animate-spin mx-auto" /> : "Obtener Acceso Anticipado"}
                            </button>
                        </form>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 text-center text-xs text-gray-600 font-mono border-t border-white/5">
                MIVIDEOAI © 2026
            </footer>
        </div>
    );
};
