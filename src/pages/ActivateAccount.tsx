import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const ActivateAccount = () => {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSendLink = async () => {
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/settings?mode=reset',
        });
        if (error) {
            alert(error.message);
        } else {
            setSent(true);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center font-sans">
            {/* Background Image with Blur & Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=2048&auto=format&fit=crop"
                    alt="Activation Background"
                    className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            </div>

            <div className="relative z-10 w-full max-w-md p-10 rounded-[40px] text-center bg-black/80 border border-[#C6A649]/20 shadow-2xl backdrop-blur-xl">

                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                    <ShieldCheck size={40} className="text-green-500" />
                </div>

                <h1 className="text-3xl font-serif font-bold text-white mb-2">Bienvenido</h1>
                <p className="text-[#C6A649] text-xs font-bold tracking-[0.2em] uppercase mb-8">Acceso Aprobado</p>

                {!sent ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <p className="text-gray-300 text-sm leading-relaxed mb-8">
                            Tu cuenta ({email}) ha sido validada por el sistema. Para activar tu acceso completo, necesitas establecer tu <strong>Contraseña Maestra</strong>.
                        </p>

                        <button
                            onClick={handleSendLink}
                            disabled={loading || !email}
                            className="w-full py-4 rounded-xl font-bold text-xs tracking-widest uppercase bg-gradient-to-r from-[#D4AF37] to-[#F2C94C] text-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            {loading ? "Enviando..." : "Crear Contraseña Maestra"}
                            <ArrowRight size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in zoom-in">
                        <div className="p-6 bg-[#C6A649]/10 border border-[#C6A649]/20 rounded-2xl mb-6">
                            <Mail size={32} className="text-[#C6A649] mx-auto mb-4" />
                            <h3 className="text-white font-bold mb-2">Revisa tu Email</h3>
                            <p className="text-gray-400 text-xs">
                                Hemos enviado un enlace seguro a <strong>{email}</strong>. Haz clic en él para configurar tu contraseña y entrar al sistema.
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="text-gray-500 text-xs hover:text-white transition-colors underline"
                        >
                            Volver al Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
