import React, { useEffect, useState } from 'react';
import { Lock, LogOut } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const AccessPending = () => {
    const [email, setEmail] = useState<string>("");

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setEmail(user.email || "Usuario");
            }
        });
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center font-sans selection:bg-[#C6A649]/30">
            <div className="animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-[#C6A649]/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#C6A649]/20 shadow-[0_0_50px_rgba(198,166,73,0.1)]">
                    <Lock size={32} className="text-[#C6A649]" />
                </div>

                <h1 className="text-2xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                    Solicitud en Revisión 🔒
                </h1>

                <p className="text-zinc-400 max-w-md mx-auto leading-relaxed mb-12">
                    Hola <span className="text-white font-medium">{email}</span>, el equipo de MivideoAI está revisando tu perfil. Te notificaremos cuando tu acceso al Marketplace sea aprobado.
                </p>

                <div className="space-y-4">
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden max-w-[200px] mx-auto">
                        <div className="h-full bg-[#C6A649] w-1/3 animate-pulse rounded-full"></div>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-[#C6A649]">Procesando</p>
                </div>

                <div className="mt-20">
                    <button
                        onClick={handleLogout}
                        className="text-zinc-600 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                    >
                        <LogOut size={12} />
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 text-center">
                <img src="/branding/logo-white.png" alt="MivideoAI" className="h-6 w-auto mx-auto opacity-30 invert-0" />
            </div>
        </div>
    );
};
