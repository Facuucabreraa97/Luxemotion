import React, { useState } from 'react';
import { Play, Mail, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { S } from '../styles';

const LOGIN_VID = "https://videos.pexels.com/video-files/3205917/3205917-hd_1920_1080_25fps.mp4";

export const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [load, setLoad] = useState(false);
  const [mode, setMode] = useState<'login'|'register'|'forgot'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoad(true);
    setErrorMsg(null);
    try {
        if(mode === 'register') {
            const { error } = await supabase.auth.signUp({ email, password: pass });
            if(error) setErrorMsg(error.message); else alert("Revisa tu email para confirmar.");
        } else if (mode === 'login') {
            const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
            if(error) setErrorMsg(error.message); else onLogin(); // Use callback instead of reload
        } else {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if(error) setErrorMsg(error.message); else alert("Correo de recuperación enviado.");
        }
    } catch(e) { setErrorMsg("Error de conexión"); }
    setLoad(false);
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[100]">
      <video src={LOGIN_VID} autoPlay loop muted className="absolute inset-0 w-full h-full object-cover opacity-40"/>
      <div className={`relative z-10 w-full max-w-xs p-10 rounded-[40px] text-center ${S.panel}`}>
        <div className="mb-10"><div className="w-16 h-16 bg-[#C6A649]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#C6A649]/20 shadow-lg"><Play fill="#C6A649" className="text-[#C6A649] w-8 h-8 ml-1"/></div><h1 className={S.titleLuxe}>LUXE</h1><p className={S.subLuxe}>MOTION PRO</p></div>

        {errorMsg && <div className="mb-4 text-red-500 text-[10px] font-bold uppercase">{errorMsg}</div>}

        {mode !== 'forgot' ? (
            <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 bg-black/50 border border-white/10 p-4 rounded-2xl focus-within:border-[#C6A649] transition-colors"><Mail size={18} className="text-white/30"/><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email Corporativo" className="bg-transparent text-white text-xs w-full outline-none placeholder:text-white/20"/></div>
                <div className="flex items-center gap-4 bg-black/50 border border-white/10 p-4 rounded-2xl focus-within:border-[#C6A649] transition-colors"><Lock size={18} className="text-white/30"/><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Contraseña" className="bg-transparent text-white text-xs w-full outline-none placeholder:text-white/20"/></div>
            </div>
        ) : (
            <div className="mb-8 text-left"><p className="text-xs text-white/60 mb-4 px-1">Recuperar acceso.</p><div className="flex items-center gap-4 bg-black/50 border border-white/10 p-4 rounded-2xl"><Mail size={18} className="text-white/30"/><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="bg-transparent text-white text-xs w-full outline-none"/></div></div>
        )}
        <button onClick={handleSubmit} disabled={load} className={`w-full py-5 rounded-2xl text-[10px] ${S.btnGold}`}>{load ? "Procesando..." : (mode === 'login' ? "Iniciar Sesión" : mode === 'register' ? "Crear Cuenta" : "Enviar")}</button>
        <div className="mt-8 flex justify-between text-[9px] text-white/40 uppercase tracking-widest border-t border-white/5 pt-6">
            {mode === 'login' ? (<><button onClick={()=>setMode('register')} className="hover:text-white">Crear Cuenta</button><button onClick={()=>setMode('forgot')} className="hover:text-white">Recuperar</button></>) : (<button onClick={()=>setMode('login')} className="w-full hover:text-white">Volver</button>)}
        </div>
      </div>
    </div>
  );
};
