
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Adjusted path
import { useNavigate } from 'react-router-dom';

export default function LandingWaitlist() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [msg, setMsg] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect if already logged in
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) navigate('/app');
        });
    }, [navigate]);


    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('LOADING');
        setMsg('');

        try {
            // 1. Direct Insert to Profiles (No Auth Signup needed for waitlist)
            const { error } = await supabase
                .from('profiles')
                .insert([{ email, status: 'PENDING' }]);

            if (error) {
                if (error.code === '23505') throw new Error('Este correo ya está en la lista.');
                throw error;
            }

            setStatus('SUCCESS');
            setMsg('¡Estás dentro! Revisa tu correo pronto.');
            setEmail('');
        } catch (err: any) {
            console.error(err);
            setStatus('ERROR');
            if (err.code === '42501') {
                setMsg('Sistema actualizándose. Intenta en 1 minuto.');
            } else {
                setMsg(err.message || 'Hubo un error. Intenta nuevamente.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black opacity-80 z-0"></div>

            <div className="z-10 w-full max-w-4xl px-6 text-center">
                {/* LOGO AREA */}
                <div className="mb-12 flex justify-center">
                    {/* Replace text with Logo Image if available, or keep High-End Text */}
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white">
                        Mivideo<span className="text-[#F2C94C]">AI</span>
                    </h1>
                </div>

                {/* HERO COPY */}
                <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-500">
                    Marketplace de influencers <br /> creados con <span className="text-[#F2C94C]">inteligencia artificial</span>
                </h2>
                <p className="text-xl text-neutral-400 mb-10 max-w-2xl mx-auto">
                    Crea, compra y vende personajes digitales listos para monetizar.
                </p>

                {/* INPUT FORM */}
                <div className="max-w-md mx-auto bg-neutral-900/50 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-2xl">
                    <p className="text-sm text-[#F2C94C] uppercase tracking-widest mb-4 font-semibold">Acceso Anticipado</p>

                    <form onSubmit={handleJoin} className="flex flex-col gap-4">
                        <input
                            type="email"
                            required
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F2C94C] transition-colors"
                        />

                        <button
                            type="submit"
                            disabled={status === 'LOADING' || status === 'SUCCESS'}
                            className="w-full py-3 rounded-lg font-bold text-black uppercase tracking-wider transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(90deg, #D4AF37 0%, #F2C94C 100%)' }}
                        >
                            {status === 'LOADING' ? 'Procesando...' : status === 'SUCCESS' ? '¡Registrado!' : 'Unirse a la Waitlist →'}
                        </button>
                    </form>

                    {msg && (
                        <p className={`mt-4 text-sm ${status === 'ERROR' ? 'text-red-400' : 'text-green-400'}`}>
                            {msg}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
