import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Hexagon, Check, Loader2 } from 'lucide-react';

export const LandingPage = () => {
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
            // Simulated connection or Real Supabase Integration
            // "Conexión simulada (o real si tienes Supabase...)"

            await new Promise(resolve => setTimeout(resolve, 1500));

            setStatus('success');
            setEmail('');
        } catch (err) {
            setStatus('error');
            setErrorMsg('Hubo un error. Intenta nuevamente.');
        }
    };

    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-blue-100 flex flex-col">

            {/* --- NAVBAR --- */}
            <nav className="w-full max-w-6xl mx-auto p-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Hexagon size={20} className="text-black fill-black" />
                    <span className="text-lg font-bold tracking-tight">MivideoAI</span>
                </div>
                <div>
                    <button
                        onClick={() => navigate('/login')}
                        className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
                    >
                        Login
                    </button>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <header className="flex-1 w-full max-w-4xl mx-auto px-6 pt-20 pb-16 flex flex-col items-center text-center">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-black">
                    MivideoAI
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-2xl mb-10">
                    Marketplace de influencers creados con inteligencia artificial, donde se pueden crear, comprar y vender personajes digitales listos para monetizar.
                </p>
                <button
                    onClick={() => document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group px-8 py-4 bg-black text-white rounded-full font-bold text-lg tracking-wide hover:bg-gray-900 hover:scale-105 transition-all flex items-center gap-2"
                >
                    Unirse a la Waitlist
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </header>

            {/* --- PROBLEM & SOLUTION GRID --- */}
            <section className="w-full max-w-6xl mx-auto px-6 py-20 bg-gray-50 rounded-3xl mb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

                    {/* PROBLEM */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-red-600 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-600"></span>
                            El Problema
                        </h3>
                        <p className="text-lg md:text-xl font-medium text-gray-800 leading-relaxed">
                            No existe una plataforma que permita crear un influencer completo de forma fácil y rápida. Las herramientas actuales son complejas, fragmentadas y no permiten vender ni comprar influencers en un solo lugar.
                        </p>
                    </div>

                    {/* SOLUTION */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            La Solución
                        </h3>
                        <p className="text-lg md:text-xl font-medium text-gray-800 leading-relaxed">
                            Una plataforma de inteligencia artificial que genera influencers virtuales listos para producir, publicar y vender contenido de forma automática.
                        </p>
                    </div>

                </div>
            </section>

            {/* --- WAITLIST FORM --- */}
            <section id="waitlist-form" className="w-full max-w-xl mx-auto px-6 pb-32 text-center">
                <div className="bg-white border border-gray-200 p-8 md:p-12 rounded-2xl shadow-xl shadow-gray-200/50">
                    <h2 className="text-2xl font-bold mb-2">Acceso Anticipado</h2>
                    <p className="text-gray-500 mb-8">Únete a los primeros creadores del futuro.</p>

                    {status === 'success' ? (
                        <div className="p-6 bg-green-50 text-green-800 rounded-xl flex flex-col items-center animate-in fade-in zoom-in">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <Check size={24} className="text-green-600" />
                            </div>
                            <h3 className="font-bold text-lg">¡Estás en la lista!</h3>
                            <p className="text-sm mt-2">Te notificaremos cuando tu acceso esté listo.</p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="mt-6 text-sm underline opacity-60 hover:opacity-100"
                            >
                                Registrar otro email
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="text-left">
                                <label htmlFor="email" className="sr-only">Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nombre@ejemplo.com"
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                                    disabled={status === 'loading'}
                                />
                                {errorMsg && (
                                    <p className="text-red-500 text-sm mt-2 ml-1 animate-pulse">{errorMsg}</p>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {status === 'loading' ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    "Obtener Acceso Anticipado"
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-8 text-center text-xs text-gray-400 font-mono uppercase tracking-widest border-t border-gray-100">
                © 2026 MivideoAI Inc. All Rights Reserved.
            </footer>

        </div>
    );
};
