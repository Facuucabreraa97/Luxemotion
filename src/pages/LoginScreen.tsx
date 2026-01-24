import React, { useState, useEffect } from 'react';
import { Play, Mail, Lock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { S } from '../styles';
import { useSearchParams, useNavigate } from 'react-router-dom';

const LOGIN_BG = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop"; // High-end fashion/urban

interface LoginScreenProps {
    onLogin?: () => void;
    initialMode?: 'login' | 'register' | 'forgot';
}

export const LoginScreen = ({ onLogin, initialMode }: LoginScreenProps) => {
    const navigate = useNavigate();
    let searchParamsMode = null;
    try {
        const [searchParams] = useSearchParams();
        const m = searchParams.get('mode');
        if (m === 'register' || m === 'forgot' || m === 'login') searchParamsMode = m;
    } catch (e) { }

    const [load, setLoad] = useState(false);
    const [mode, setMode] = useState<'login' | 'register' | 'forgot'>((searchParamsMode as any) || initialMode || 'login');
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (initialMode) setMode(initialMode);
    }, [initialMode]);

    const checkStatusAndLogin = async () => {
        setLoad(true);
        setErrorMsg(null);

        try {
            // GOLDEN GATE LOGIC: Check Status First
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('status')
                .eq('email', email)
                .single();

            if (!profile) {
                // User doesn't exist -> Redirect to Waitlist
                alert("No encontramos tu email. Redirigiendo a waitlist...");
                window.location.href = "/#waitlist-form";
                setLoad(false);
                return;
            }

            if (profile.status === 'PENDING') {
                setErrorMsg("Tu solicitud sigue en revisión. Te notificaremos pronto.");
                setLoad(false);
                return;
            }

            if (profile.status === 'APPROVED') {
                // Redirect to Activation
                navigate(`/activate-account?email=${encodeURIComponent(email)}`);
                return;
            }

            if (profile.status === 'ACTIVE') {
                // Standard Login
                if (!pass) {
                    setErrorMsg("Ingresa tu contraseña.");
                    setLoad(false);
                    return;
                }
                const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
                if (error) setErrorMsg("Contraseña incorrecta.");
            }

        } catch (e) {
            console.error(e);
            // Fallback for standard login if profile check fails (e.g., table missing)
            const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
            if (error) setErrorMsg(error.message);
        }
        setLoad(false);
    };

    const handleRegister = async () => {
        // Direct registration is now BLOCKED by design, but we keep the method for admin/internal bypass if needed
        // For now, redirect users to waitlist
        window.location.href = "/#waitlist-form";
    };

    const handleSubmit = async () => {
        if (mode === 'login') {
            await checkStatusAndLogin();
        } else if (mode === 'register') {
            await handleRegister();
        } else {
            // Forgot Password
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/settings?mode=reset',
            });
            if (error) setErrorMsg(error.message); else alert("Correo de recuperación enviado.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-[100] font-sans">
            {/* Background Image with Blur & Overlay */}
            <div className="absolute inset-0 z-0">
                <img src={LOGIN_BG} alt="Fashion Background" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            </div>

            <div className="relative z-10 w-full max-w-sm p-8 rounded-[32px] text-center bg-black/80 border border-[#C6A649]/20 shadow-2xl backdrop-blur-xl">

                {/* Header */}
                <div className="mb-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#C6A649]/20 to-black rounded-2xl flex items-center justify-center mb-6 border border-[#C6A649]/40 shadow-[0_0_15px_rgba(198,166,73,0.2)]">
                        <Play fill="#C6A649" className="text-[#C6A649] w-6 h-6 ml-1" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">MivideoAI</h1>
                    <p className="text-[10px] font-bold text-[#C6A649] tracking-[0.3em] uppercase">PRO</p>
                </div>

                {errorMsg && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-200 text-xs text-left animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={16} className="shrink-0" />
                        {errorMsg}
                    </div>
                )}

                {mode !== 'forgot' ? (
                    <div className="space-y-4 mb-8">
                        <div className="group relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Mail size={16} className="text-white/40 group-focus-within:text-[#C6A649] transition-colors" />
                            </div>
                            <input
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Email Corporativo"
                                className="w-full bg-black/60 border border-[#C6A649]/30 text-white text-sm py-4 pl-12 pr-4 rounded-xl outline-none focus:border-[#C6A649] focus:ring-1 focus:ring-[#C6A649]/50 transition-all placeholder:text-white/20"
                            />
                        </div>
                        <div className="group relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Lock size={16} className="text-white/40 group-focus-within:text-[#C6A649] transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={pass}
                                onChange={e => setPass(e.target.value)}
                                placeholder="Contraseña"
                                className="w-full bg-black/60 border border-[#C6A649]/30 text-white text-sm py-4 pl-12 pr-4 rounded-xl outline-none focus:border-[#C6A649] focus:ring-1 focus:ring-[#C6A649]/50 transition-all placeholder:text-white/20"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="mb-8 text-left">
                        <p className="text-xs text-white/60 mb-4 px-1">Ingresa tu email para recuperar el acceso.</p>
                        <div className="group relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Mail size={16} className="text-white/40 group-focus-within:text-[#C6A649] transition-colors" />
                            </div>
                            <input
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Email"
                                className="w-full bg-black/60 border border-[#C6A649]/30 text-white text-sm py-4 pl-12 pr-4 rounded-xl outline-none focus:border-[#C6A649] transition-all placeholder:text-white/20"
                            />
                        </div>
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={load}
                    className="w-full py-4 rounded-xl font-bold text-xs tracking-widest uppercase bg-gradient-to-r from-[#D4AF37] to-[#F2C94C] text-black hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {load ? "Procesando..." : (mode === 'login' ? "INICIAR SESIÓN" : mode === 'register' ? "SOLICITAR ACCESO" : "ENVIAR")}
                    {!load && <ArrowRight size={14} />}
                </button>

                <div className="mt-8 flex justify-center gap-6 text-[10px] text-white/40 uppercase tracking-widest border-t border-white/5 pt-6">
                    {mode === 'login' ? (
                        <>
                            <button onClick={() => window.location.href = "/#waitlist-form"} className="hover:text-[#C6A649] transition-colors">Solicitar Acceso</button>
                            <button onClick={() => setMode('forgot')} className="hover:text-[#C6A649] transition-colors">Recuperar</button>
                        </>
                    ) : (
                        <button onClick={() => setMode('login')} className="hover:text-[#C6A649] transition-colors">Volver al Login</button>
                    )}
                </div>
            </div>
        </div>
    );
};
