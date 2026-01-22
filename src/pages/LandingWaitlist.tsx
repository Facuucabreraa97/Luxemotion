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
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-gray-200 flex flex-col">

            {/* HERO SECTION */}
            <header className="w-full max-w-5xl mx-auto px-6 pt-12 pb-20 flex flex-col items-center text-center">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-12 self-start md:self-center">
                    <Hexagon size={24} className="text-black fill-black" />
                    <span className="text-xl font-bold tracking-tight">MivideoAI</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-black max-w-3xl">
                    Marketplace de influencers creados con inteligencia artificial
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mb-10">
                    Crea, compra y vende personajes digitales listos para monetizar.
                </p>
                <button
                    onClick={() => document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group px-8 py-4 bg-black text-white rounded-full font-bold text-lg tracking-wide hover:bg-gray-800 hover:scale-105 transition-all flex items-center gap-2"
                >
                    Unirse a la Waitlist
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </header>

            {/* VALUE PROPOSITION: Problem/Solution */}
            <section className="w-full bg-gray-50 py-20 border-y border-gray-100">
                <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Problem */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">El Problema</h3>
                        <p className="text-lg font-medium text-gray-800 leading-relaxed">
                            No existe una plataforma que permita crear un influencer completo de forma fácil y rápida. Las herramientas actuales son complejas y fragmentadas.
                        </p>
                    </div>
                    {/* Solution */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">La Solución</h3>
                        <p className="text-lg font-medium text-gray-800 leading-relaxed">
                            Una plataforma de inteligencia artificial que genera influencers virtuales listos para producir, publicar y vender contenido de forma automática.
                        </p>
                    </div>
                </div>
            </section>

            {/* WAITLIST MECHANISM */}
            <section id="waitlist-form" className="w-full py-24 px-6 flex flex-col items-center">
                <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-2xl shadow-xl shadow-gray-100">
                    <h2 className="text-2xl font-bold text-center mb-2">Acceso Anticipado</h2>
                    <p className="text-center text-gray-500 mb-8 text-sm">Sé el primero en acceder al marketplace.</p>

                    {status === 'success' ? (
                        <div className="p-6 bg-green-50 text-green-800 rounded-xl flex flex-col items-center animate-in fade-in zoom-in">
                            <Check size={32} className="text-green-600 mb-2" />
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
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    disabled={status === 'loading'}
                                />
                                {errorMsg && <p className="text-red-500 text-xs mt-2">{errorMsg}</p>}
                            </div>
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                {status === 'loading' ? <Loader2 size={20} className="animate-spin mx-auto" /> : "Obtener Acceso Anticipado"}
                            </button>
                        </form>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 text-center text-xs text-gray-400 font-mono border-t border-gray-100">
                MIVIDEOAI © 2026
            </footer>
        </div>
    );
};
