import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js'; 
import { 
  Upload, Play, Download, Zap, Loader2, Monitor, Smartphone, Square, 
  LayoutDashboard, CreditCard, Image as ImageIcon, Settings, X, Lock,
  Move, ZoomIn, Heart, Video, Info, Users, Plus, Flame, Sparkles,
  Check, Camera, Film, LogOut, Mail, ChevronRight, HelpCircle, Globe,
  Shield, AlertTriangle, Eye, RefreshCw, Save, DollarSign, Bitcoin
} from 'lucide-react';

// --- 1. DEFINICIÓN DE TIPOS ---
interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  instagram?: string;
  telegram?: string;
  avatar?: string | null;
}

interface Talent {
  id: string;
  name: string;
  image_url: string;
}

interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  date: string;
  aspectRatio: string;
  cost: number;
}

// --- 2. CONFIGURACIÓN ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- 3. ESTILOS "LUXE PRO" ---
const S = {
  bg: "bg-[#030303] text-white font-sans min-h-screen selection:bg-[#C6A649] selection:text-black",
  panel: "bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/5 shadow-2xl transition-all duration-300 hover:border-[#C6A649]/20",
  input: "bg-black/40 border border-white/10 text-white p-4 rounded-xl focus:border-[#C6A649]/50 outline-none transition-all text-xs w-full placeholder:text-white/20",
  btnGold: "bg-gradient-to-r from-[#C6A649] to-[#FBF5B7] text-black font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(198,166,73,0.3)] hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(198,166,73,0.5)] active:scale-95 transition-all duration-300 rounded-xl cursor-pointer",
  btnVelvet: "bg-gradient-to-r from-pink-700 via-purple-800 to-indigo-900 text-white font-bold uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(236,72,153,0.4)] hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(236,72,153,0.6)] active:scale-95 transition-all duration-300 border border-pink-500/30 rounded-xl cursor-pointer",
  activeTab: "bg-[#C6A649] text-black shadow-lg border-none font-bold",
  inactiveTab: "bg-black/40 text-gray-400 border border-white/10 hover:text-white hover:bg-white/5",
  titleLuxe: "text-3xl font-bold tracking-[0.2em] text-white uppercase",
  subLuxe: "text-[9px] text-[#C6A649] mt-2 uppercase tracking-[0.4em] font-bold"
};

// --- 4. DATOS Y CONSTANTES ---
const DEMO_IMG = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop";
const DEMO_PROD = "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop";
const LOGIN_VID = "https://videos.pexels.com/video-files/3205917/3205917-hd_1920_1080_25fps.mp4";
const DEMO_TXT = "Cinematic slow motion shot, elegant lighting, 8k resolution";

const CAMS = [
  { id: 'static', label: 'TRÍPODE', icon: <Move size={18}/>, desc: "Cámara fija. Ideal para resaltar detalles." },
  { id: 'zoom', label: 'ZOOM IN', icon: <ZoomIn size={18}/>, desc: "Acercamiento lento y dramático." },
  { id: 'eye', label: 'MIRADA', icon: <Heart size={18}/>, desc: "Contacto visual intenso." },
  { id: 'hand', label: 'MANO', icon: <Video size={18}/>, desc: "Movimiento orgánico tipo vlog." }
];

const RATIOS = [
  { id: '9:16', label: 'Stories', icon: <Smartphone size={14}/> },
  { id: '16:9', label: 'Cinema', icon: <Monitor size={14}/> },
  { id: '1:1', label: 'Square', icon: <Square size={14}/> }
];

const VELVET_STYLES = [
  { id: 'glam', name: 'Lingerie', desc: 'Boudoir' },
  { id: 'pov', name: 'POV Date', desc: 'Girlfriend Exp.' },
  { id: 'cosplay', name: 'Cosplay', desc: 'Spicy & Realistic' },
  { id: 'hentai', name: 'H-Style', desc: 'Anime Realism' },
];

const PRICING = {
  starter: { name: "Starter", creds: 50, price: 0, feats: ["Calidad HD", "1 Modelo", "Marca de Agua", "Soporte Básico"] },
  creator: { name: "Influencer", creds: 1000, price: 29, yearlyPrice: 24, popular: true, feats: ["4K Ultra", "Velvet Mode", "5 Modelos", "Licencia Comercial", "Sin Marca de Agua"] },
  agency: { name: "Agency", creds: 5000, price: 99, yearlyPrice: 79, feats: ["Todo Ilimitado", "API Access", "Prioridad Total", "Account Manager", "Soporte 24/7"] }
};

// --- 5. COMPONENTES UI ---

const Tooltip = ({ txt }: { txt: string }) => (
  <div className="group relative inline-flex ml-2 cursor-help align-middle z-50">
    <Info size={14} className="text-white/30 hover:text-[#C6A649] transition-colors"/>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 bg-[#111] border border-[#C6A649]/30 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-[10px] text-gray-300 text-center pointer-events-none shadow-xl backdrop-blur-md">
      {txt}
    </div>
  </div>
);

const Toast = ({ msg, onClose }: any) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 fade-in">
      <div className="bg-[#050505]/95 backdrop-blur-xl border border-[#C6A649] px-6 py-4 rounded-full flex items-center gap-4 shadow-[0_0_40px_rgba(198,166,73,0.3)]">
        <Check size={14} className="text-[#C6A649]"/>
        <span className="text-white text-xs font-bold uppercase tracking-widest">{msg}</span>
      </div>
    </div>
  );
};

const VelvetModal = ({ onClose, onOk }: any) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-in zoom-in duration-300">
    <div className={`w-full max-w-sm p-1 rounded-[40px] relative group overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-900 opacity-50 blur-xl"></div>
      <div className="bg-[#050505] relative rounded-[38px] p-8 text-center border border-pink-500/30 h-full">
        <button onClick={onClose} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"><X size={20}/></button>
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-tr from-pink-600 to-purple-900 rounded-full flex items-center justify-center border border-pink-500/50 shadow-lg">
             <Flame size={32} className="text-white fill-white"/>
        </div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400 uppercase tracking-[0.2em] mb-4">Velvet Mode</h2>
        <div className="inline-block px-4 py-1 border border-pink-500/30 rounded-full bg-pink-500/10 mb-6"><span className="text-[9px] font-bold text-pink-400 uppercase tracking-[0.3em]">Solo Adultos +18</span></div>
        <p className="text-white/50 text-xs mb-8 leading-relaxed">Generación sin censura optimizada para hiperrealismo, texturas de piel y contenido insinuante.</p>
        <button onClick={onOk} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 group ${S.btnVelvet}`}><span>Desbloquear</span> <ChevronRight size={16}/></button>
      </div>
    </div>
  </div>
);

const CheckoutModal = ({ planKey, annual, onClose }: any) => {
  const p = PRICING[planKey as keyof typeof PRICING];
  const [proc, setProc] = useState(false);
  const [currency, setCurrency] = useState<'USD'|'ARS'>('USD');
  const [method, setMethod] = useState<'card'|'crypto'>('card');
  const finalPrice = annual && (p as any).yearlyPrice ? (p as any).yearlyPrice : p.price;
  const displayPrice = currency === 'ARS' ? finalPrice * 1150 : finalPrice;
  
  const handlePay = async () => { 
      setProc(true); 
      try {
          const r = await fetch('http://localhost:3001/api/create-preference', {
              method: 'POST', headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ title: `Plan ${p.name}`, price: displayPrice, quantity: 1, currency })
          });
          const d = await r.json();
          if (d.url) window.location.href = d.url;
          else throw new Error("Error en pago");
      } catch(e) { alert("Error de conexión"); setProc(false); }
  };
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in">
      <div className={`w-full max-w-md p-8 rounded-[40px] text-center relative ${S.panel}`}>
        <button onClick={onClose} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={20}/></button>
        <h3 className="text-white font-bold uppercase tracking-[0.3em] mb-2 text-sm">Checkout</h3>
        <p className="text-[#C6A649] text-xs font-bold uppercase tracking-widest mb-6">{p.name} {annual ? '(Anual)' : '(Mensual)'}</p>
        
        <div className="bg-white/5 p-4 rounded-xl mb-6 text-left">
            <p className="text-[10px] text-white/50 uppercase mb-2 font-bold">Resumen:</p>
            <ul className="text-xs text-white/80 space-y-1">
                <li>• Acceso inmediato a {p.creds} créditos</li>
                <li>• Desbloqueo de funciones {p.name === 'Influencer' ? 'Velvet' : 'Pro'}</li>
                <li>• Cancelación en cualquier momento</li>
            </ul>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={()=>setMethod('card')} className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${method==='card' ? 'border-[#C6A649] bg-[#C6A649]/10 text-[#C6A649]' : 'border-white/10 text-white/40'}`}>
                <CreditCard size={14}/><span className="text-[10px] font-bold">Tarjeta</span>
            </button>
            <button onClick={()=>setMethod('crypto')} className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${method==='crypto' ? 'border-[#C6A649] bg-[#C6A649]/10 text-[#C6A649]' : 'border-white/10 text-white/40'}`}>
                <Bitcoin size={14}/><span className="text-[10px] font-bold">Cripto (USDT)</span>
            </button>
        </div>

        <div className="flex gap-2 mb-6 bg-black/30 p-1 rounded-xl">
            <button onClick={()=>setCurrency('USD')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase ${currency==='USD' ? 'bg-[#C6A649] text-black' : 'text-gray-500'}`}>USD / USDT</button>
            <button onClick={()=>setCurrency('ARS')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase ${currency==='ARS' ? 'bg-[#C6A649] text-black' : 'text-gray-500'}`}>Pesos ARS</button>
        </div>

        <div className="flex justify-between items-end py-4 border-t border-white/10 mb-6">
            <div className="text-left"><span className="block text-white/40 text-[10px] uppercase font-bold tracking-widest">Total</span><span className="text-[9px] text-[#C6A649]">IVA Incluido</span></div>
            <span className="text-3xl font-bold text-white tracking-tighter">{currency === 'USD' ? '$' : '$'}{displayPrice.toLocaleString()}</span>
        </div>
        <button onClick={handlePay} disabled={proc} className={`w-full py-4 rounded-2xl text-xs ${S.btnGold}`}>{proc ? "Procesando..." : "Confirmar y Pagar"}</button>
        <p className="text-[8px] text-white/20 mt-4 flex items-center justify-center gap-1"><Shield size={8}/> Pagos procesados de forma segura. Al continuar aceptas los términos.</p>
      </div>
    </div>
  );
};

// --- 6. PÁGINAS ---

const LoginScreen = ({ onLogin }: any) => {
  const [load, setLoad] = useState(false);
  const [mode, setMode] = useState<'login'|'register'|'forgot'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  const handleSubmit = async () => {
    setLoad(true);
    try {
        if(mode === 'register') {
            const { error } = await supabase.auth.signUp({ email, password: pass });
            if(error) alert(error.message); else alert("Revisa tu email para confirmar.");
        } else if (mode === 'login') {
            const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
            if(error) alert(error.message); else window.location.reload();
        } else {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if(error) alert(error.message); else alert("Correo de recuperación enviado.");
        }
    } catch(e) { alert("Error de conexión"); }
    setLoad(false);
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[100]">
      <video src={LOGIN_VID} autoPlay loop muted className="absolute inset-0 w-full h-full object-cover opacity-40"/>
      <div className={`relative z-10 w-full max-w-xs p-10 rounded-[40px] text-center ${S.panel}`}>
        <div className="mb-10"><div className="w-16 h-16 bg-[#C6A649]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#C6A649]/20 shadow-lg"><Play fill="#C6A649" className="text-[#C6A649] w-8 h-8 ml-1"/></div><h1 className={S.titleLuxe}>LUXE</h1><p className={S.subLuxe}>MOTION PRO</p></div>
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

const StudioPage = ({ onGen, credits, notify, onUp, userPlan, talents }: any) => {
  const [img, setImg] = useState<string|null>(null);
  const [prod, setProd] = useState<string|null>(null);
  const [vid, setVid] = useState<string|null>(null);
  const [type, setType] = useState<'img'|'vid'>('img');
  const [prompt, setPrompt] = useState('');
  const [cam, setCam] = useState('static');
  const [ratio, setRatio] = useState('9:16');
  const [dur, setDur] = useState(5);
  const [velvet, setVelvet] = useState(false);
  const [velvetStyle, setVelvetStyle] = useState('glam');
  const [loading, setLoading] = useState(false);
  const [resUrl, setResUrl] = useState<string|null>(null);
  const [modal, setModal] = useState(false);

  const init = useRef(false);
  useEffect(() => { if(!init.current) { setImg(DEMO_IMG); setProd(DEMO_PROD); setPrompt(DEMO_TXT); init.current=true; } }, []);

  const handleFile = (e:any, setter:any) => { const f = e.target.files[0]; if(f) { const r=new FileReader(); r.onload=()=>setter(r.result); r.readAsDataURL(f); } };
  const toggleVelvet = () => { if(userPlan==='starter') setModal(true); else { setVelvet(!velvet); notify(velvet ? "Modo Standard" : "Modo Velvet Activado"); }};
  const calculateCost = () => { let base = dur === 5 ? 10 : 20; if (velvet) base += 10; return base; };
  const handlePromptInjection = (text: string) => { setPrompt(prev => prev + (prev ? ", " : "") + text); };

  const generate = async () => {
      if(!img && !vid) return;
      const cost = calculateCost();
      if(credits < cost) { notify("Faltan Créditos"); onUp(); return; }
      setLoading(true); setResUrl(null);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          const r = await fetch('http://localhost:3001/api/generate', {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
              body: JSON.stringify({ image: img, endImage: prod, inputVideo: vid, prompt, duration: dur, aspectRatio: ratio, mode: velvet?'velvet':'standard', velvetStyle: velvet?velvetStyle:null })
          });
          const d = await r.json();
          if(d.videoUrl) { setResUrl(d.videoUrl); onGen(d.videoUrl, cost); notify("¡Video Generado!"); } else throw new Error(d.error);
      } catch(e:any) { console.error(e); notify("Error de conexión"); } finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-0 pb-32">
      {modal && <VelvetModal onClose={()=>setModal(false)} onOk={()=>{setModal(false); setVelvet(true); notify("Modo Velvet Activado 🔥");}}/>}
      <div className="lg:col-span-7 space-y-6">
        <div className={`p-8 rounded-[40px] ${S.panel}`}>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] flex gap-3"><span className="text-[#C6A649]">01</span> Origen <Tooltip txt="Sube tu imagen base."/></h2>
                <div className="bg-black/40 p-1.5 rounded-full border border-white/10 flex"><button onClick={()=>{setType('img'); setVid(null);}} className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase transition-all ${type==='img'?S.activeTab:S.inactiveTab}`}>Foto</button><button onClick={()=>{setType('vid'); setImg(null);}} className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase transition-all ${type==='vid'?S.activeTab:S.inactiveTab}`}>Remix</button></div>
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div className={`aspect-[3/4] rounded-[30px] border-2 border-dashed relative overflow-hidden group transition-all duration-300 ${type==='vid'?'border-blue-500/30':'border-white/10 hover:border-[#C6A649]/50'}`}>
                    {type==='img' ? ( img ? (<><img src={img} className="w-full h-full object-cover"/>{img===DEMO_IMG && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#C6A649] text-black text-[8px] font-bold px-3 py-1 rounded-full uppercase shadow-lg flex gap-2"><Sparkles size={10}/> Demo</div>}<button onClick={()=>{setImg(null);}} className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white hover:bg-red-500 transition-all z-20"><X size={14}/></button></>) : <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20"><Upload className="mb-4 w-8 h-8"/><span className="text-[9px] uppercase font-bold tracking-widest">Subir Modelo</span><input type="file" onChange={e=>handleFile(e, setImg)} className="absolute inset-0 opacity-0 cursor-pointer"/></div> ) : ( vid ? (<><video src={vid} autoPlay loop muted className="w-full h-full object-cover opacity-50"/><button onClick={()=>setVid(null)} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-red-500 z-20"><X size={14}/></button></>) : <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-500/40"><Film className="mb-4 w-8 h-8"/><span className="text-[9px] uppercase font-bold tracking-widest">Subir Video</span><input type="file" onChange={e=>handleFile(e, setVid)} className="absolute inset-0 opacity-0 cursor-pointer"/></div> )}
                </div>
                {/* SELECTOR DE CASTING */}
                <div className="flex flex-col gap-4">
                     <div className={`aspect-[3/4] rounded-[30px] border-2 border-dashed border-white/10 relative overflow-hidden group hover:border-[#C6A649]/50 transition-all duration-300 bg-black/20`}>{prod ? (<><img src={prod} className="w-full h-full object-cover"/>{prod===DEMO_PROD && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#C6A649] text-black text-[8px] font-bold px-3 py-1 rounded-full uppercase shadow-lg flex gap-2"><Sparkles size={10}/> Demo</div>}<button onClick={()=>setProd(null)} className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white hover:bg-red-500 transition-all z-20"><X size={14}/></button></>) : <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20"><Plus className="mb-4 w-8 h-8"/><span className="text-[9px] uppercase font-bold tracking-widest">Producto / Ref</span><input type="file" onChange={e=>handleFile(e, setProd)} className="absolute inset-0 opacity-0 cursor-pointer"/></div>}</div>
                     {talents && talents.length > 0 && (
                        <div className="bg-black/40 border border-white/10 rounded-2xl p-2 max-h-32 overflow-y-auto">
                            <p className="text-[9px] text-white/50 uppercase tracking-widest mb-2 pl-2">Usar Talento Guardado</p>
                            <div className="grid grid-cols-3 gap-2">
                                {talents.map((t:Talent) => (
                                    <button key={t.id} onClick={()=>setImg(t.image_url)} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-[#C6A649] transition-all group">
                                        <img src={t.image_url} className="w-full h-full object-cover"/>
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Plus size={12}/></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                     )}
                </div>
            </div>
        </div>

        <div className={`p-8 rounded-[40px] ${S.panel}`}>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] flex gap-3"><span className="text-[#C6A649]">02</span> Ajustes <Tooltip txt="Personaliza la generación."/></h2>
                <button onClick={toggleVelvet} className={`px-6 py-2.5 rounded-full border text-[9px] font-bold uppercase flex items-center gap-3 transition-all ${velvet?'border-pink-500 text-white bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.3)]':'border-white/10 text-gray-500 hover:border-white/30'}`}>{velvet ? <Flame size={14} className="text-pink-500 animate-pulse"/> : <Flame size={14}/>} Velvet Mode {userPlan==='starter' && <Lock size={10} className="ml-1 text-white/50"/>}</button>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-8">{CAMS.map(m => (<button key={m.id} onClick={()=>setCam(m.id)} className={`relative p-4 rounded-3xl border flex flex-col items-center gap-3 transition-all group ${cam===m.id ? 'bg-[#C6A649] border-[#C6A649] text-black shadow-lg' : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/20 hover:bg-white/5'}`}>{m.icon}<span className="text-[7px] font-bold uppercase tracking-widest">{m.label}</span><div className="absolute inset-0 bg-black/90 flex items-center justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-center text-white">{m.desc}</div></button>))}</div>
            {velvet && <div className="grid grid-cols-4 gap-3 mb-6 animate-in fade-in slide-in-from-top-4">{VELVET_STYLES.map(v => (<button key={v.name} onClick={()=>{setVelvetStyle(v.id); handlePromptInjection(v.desc);}} className={`p-3 rounded-2xl border transition-all text-center group ${velvetStyle===v.id ? 'bg-pink-500/10 border-pink-500 text-white' : 'bg-black/40 border-white/5 text-white/50 hover:bg-white/5'}`}><p className="text-[8px] font-bold uppercase tracking-widest mb-1">{v.name}</p></button>))}</div>}
            <div className="relative group"><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe tu visión..." className={`${S.input} h-32 mb-8 resize-none p-6 text-sm ${velvet ? 'border-pink-900/50 focus:border-pink-500' : ''}`}/><div className="absolute bottom-10 right-4"><Sparkles size={16} className="text-[#C6A649] opacity-50"/></div></div>
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-white/5">
                <div className="space-y-4"><div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest text-white/40">Duración <Tooltip txt="Más tiempo = Más costo"/></span><span className="text-[#C6A649] font-bold text-xs">{dur}s</span></div><div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10"><button onClick={()=>setDur(5)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${dur===5 ? S.activeTab : S.inactiveTab}`}>5s (10cr)</button><button onClick={()=>setDur(10)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${dur===10 ? S.activeTab : S.inactiveTab}`}>10s (20cr)</button></div></div>
                <div className="space-y-4"><div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest text-white/40">Formato <Tooltip txt="Ratio de aspecto"/></span></div><div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">{RATIOS.map(r => (<button key={r.id} onClick={() => setRatio(r.id)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${ratio === r.id ? S.activeTab : S.inactiveTab}`}>{r.id}</button>))}</div></div>
            </div>
        </div>

        <button onClick={generate} disabled={loading || (!img && !vid)} className={`w-full py-7 rounded-[32px] font-bold uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 fixed bottom-6 left-4 right-4 lg:static lg:w-full z-50 ${velvet ? S.btnVelvet : S.btnGold}`}>{loading ? "Procesando..." : <><Zap size={18}/> Generar ({calculateCost()} Créditos)</>}</button>
      </div>

      <div className="lg:col-span-5 relative z-10 flex flex-col items-center pt-8">
         <div className={`sticky top-8 w-full max-w-[420px] bg-black rounded-[40px] border border-white/10 overflow-hidden shadow-2xl relative transition-all duration-500 ${ratio==='16:9'?'aspect-video':ratio==='1:1'?'aspect-square':'aspect-[9/16]'}`}>
            <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20 pointer-events-none opacity-60"><div className="text-[10px] text-white font-mono flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> REC</div><div className="text-[10px] text-white font-mono">{dur}s • 4K</div></div>
            {!resUrl && !loading && <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10 gap-6"><div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center"><Video size={40} strokeWidth={1}/></div><span className="text-[9px] uppercase tracking-[0.4em] font-light">Render Stage</span></div>}
            {loading && <div className="absolute inset-0 bg-[#050505] z-30 flex flex-col items-center justify-center"><div className="w-20 h-20 border-t-2 border-r-2 rounded-full animate-spin mb-8 border-[#C6A649] shadow-[0_0_30px_rgba(198,166,73,0.2)]"></div><p className="text-[#C6A649] text-[10px] uppercase tracking-widest animate-pulse font-bold">Creando Obra Maestra...</p></div>}
            {resUrl && <video src={resUrl} controls autoPlay loop className="w-full h-full object-cover"/>}
         </div>
         {resUrl && <a href={resUrl} download className="mt-8 px-12 py-5 bg-white text-black rounded-full text-[10px] font-bold uppercase hover:scale-105 transition-transform flex gap-3 shadow-2xl"><Download size={16}/> Descargar 4K</a>}
      </div>
    </div>
  );
};

const TalentPage = ({ list, add, del, notify }: any) => {
  const [img, setImg] = useState<string|null>(null);
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const handleFile = (e:any) => { const f=e.target.files[0]; if(f){const r=new FileReader(); r.onload=()=>setImg(r.result as string); r.readAsDataURL(f);} };
  const save = () => { if(img && name) { add({id:Date.now().toString(), name, image_url:img}); setOpen(false); setImg(null); setName(''); notify("Modelo Guardado"); } };
  return (
    <div className="p-6 lg:p-12 pb-32 animate-in fade-in">
        <div className="flex justify-between items-end border-b border-white/10 pb-8 mb-12"><div><h2 className="text-4xl font-bold uppercase tracking-[0.1em] text-white">Casting</h2><p className={S.subLuxe}>Base de Datos</p></div><button onClick={()=>setOpen(!open)} className="px-8 py-3 border border-white/20 rounded-full text-[10px] uppercase font-bold hover:bg-[#C6A649] hover:text-black transition-all text-white flex items-center gap-2">{open?<X size={14}/>:<Plus size={14}/>} {open?"Cancelar":"Nuevo Talento"}</button></div>
        {open && (<div className={`grid grid-cols-1 md:grid-cols-2 gap-12 p-12 rounded-[40px] mb-12 ${S.panel}`}><div className="aspect-[3/4] bg-black/30 rounded-[30px] border-2 border-dashed border-white/10 flex items-center justify-center relative overflow-hidden group hover:border-[#C6A649]/50 transition-all cursor-pointer">{img ? <img src={img} className="w-full h-full object-cover"/> : <div className="text-center opacity-30"><Upload className="mx-auto mb-4 w-8 h-8"/><span className="text-[10px] font-bold uppercase tracking-widest">Subir Foto</span></div>}<input type="file" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer"/></div><div className="flex flex-col justify-center gap-8"><div className="space-y-2"><label className="text-[10px] uppercase tracking-widest text-white/40">Nombre del Talento</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Sofia" className={S.input}/></div><button onClick={save} disabled={!img || !name} className={`w-full py-5 rounded-2xl text-[10px] font-bold uppercase ${S.btnGold}`}>Guardar Ficha</button></div></div>)}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">{list.map((inf:Talent) => (<div key={inf.id} className={`rounded-[30px] overflow-hidden relative group ${S.panel} hover:-translate-y-2`}><img src={inf.image_url} className="aspect-[3/4] object-cover w-full group-hover:scale-105 transition-transform duration-700"/><div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent pt-20 flex justify-between items-end"><span className="text-[10px] font-bold uppercase tracking-widest text-white">{inf.name}</span><button onClick={()=>del(inf.id)} className="bg-white/10 p-2 rounded-full text-white/50 hover:text-red-500 hover:bg-white/20 transition-all"><X size={12}/></button></div></div>))}</div>
    </div>
  );
};

const GalleryPage = ({ videos }: any) => (
  <div className="p-6 lg:p-12 pb-32 animate-in fade-in">
    <h2 className="text-4xl font-bold uppercase tracking-[0.2em] mb-12 border-b border-white/10 pb-8 text-white">Portfolio</h2>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {videos.map((v:any) => (
            <div key={v.id} className={`rounded-[30px] overflow-hidden group relative ${S.panel} hover:-translate-y-2`}>
                <video src={v.url} className="aspect-[9/16] object-cover w-full" controls/>
                <div className="p-5 bg-[#0a0a0a] flex justify-between items-center"><span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">{v.date}</span><a href={v.url} download className="bg-white/5 p-2 rounded-full text-[#C6A649] hover:bg-[#C6A649] hover:text-black transition-all"><Download size={14}/></a></div>
            </div>
        ))}
        {videos.length===0 && <div className="col-span-full text-center py-32 text-white/20 uppercase text-xs tracking-[0.4em]">Sin producciones aún</div>}
    </div>
  </div>
);

const SettingsPage = ({ profile, setProfile, notify }: any) => {
  const [data, setData] = useState(profile);
  
  const save = async () => { 
      const { data: { user } } = await supabase.auth.getUser();
      if(user) {
          // Asumimos que la tabla profiles tiene estos campos
          // Si no, hay que crearlos en Supabase SQL Editor
          await supabase.from('profiles').update({ 
              instagram: data.instagram, 
              telegram: data.telegram,
              phone: data.phone 
          }).eq('id', user.id);
          notify("Perfil Actualizado"); 
      }
  };

  return (
    <div className="p-6 lg:p-12 max-w-4xl mx-auto">
       <h2 className="text-4xl font-bold uppercase tracking-[0.2em] mb-12 border-b border-white/10 pb-8 text-white">Ajustes</h2>
       <div className={`p-10 rounded-[40px] mb-12 ${S.panel} flex items-center gap-10`}>
           <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#C6A649] to-black p-[2px] flex items-center justify-center"><span className="text-3xl font-bold text-[#C6A649]">JD</span></div>
           <div><h3 className="text-2xl font-bold text-white">{data.name}</h3><p className="text-[#C6A649] text-xs uppercase tracking-widest font-bold mt-1">Plan Pro</p></div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
           <div className="space-y-2"><label className="text-[10px] uppercase tracking-widest text-white/40">Instagram</label><input value={data.instagram || ''} onChange={e=>setData({...data, instagram:e.target.value})} className={S.input} placeholder="@usuario"/></div>
           <div className="space-y-2"><label className="text-[10px] uppercase tracking-widest text-white/40">Telegram</label><input value={data.telegram || ''} onChange={e=>setData({...data, telegram:e.target.value})} className={S.input} placeholder="@usuario"/></div>
           <div className="space-y-2"><label className="text-[10px] uppercase tracking-widest text-white/40">Teléfono</label><input value={data.phone || ''} onChange={e=>setData({...data, phone:e.target.value})} className={S.input} placeholder="+123456789"/></div>
       </div>
       <button onClick={save} className={`w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs ${S.btnGold}`}>Guardar Cambios</button>
    </div>
  );
};

const BillingPage = ({ onSelect }: any) => {
  const [annual, setAnnual] = useState(true);
  return (
    <div className="p-6 lg:p-12 pb-32 max-w-7xl mx-auto animate-in fade-in">
      <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white uppercase tracking-[0.2em] mb-4">Membresía</h2>
          <div className="flex items-center justify-center gap-4 mt-8">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${!annual ? 'text-[#C6A649]' : 'text-white/40'}`}>Mensual</span>
              <button onClick={()=>setAnnual(!annual)} className="w-12 h-6 bg-white/10 rounded-full relative p-1 transition-colors hover:bg-white/20"><div className={`w-4 h-4 bg-[#C6A649] rounded-full shadow-lg transition-transform duration-300 ${annual ? 'translate-x-6' : ''}`}></div></button>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${annual ? 'text-[#C6A649]' : 'text-white/40'}`}>Anual <span className="bg-[#C6A649] text-black px-2 py-0.5 rounded text-[8px] ml-1">-20%</span></span>
          </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {Object.entries(PRICING).map(([k, p]) => {
              const price = annual && (p as any).yearlyPrice ? (p as any).yearlyPrice : p.price;
              return (
                  <div key={k} className={`p-10 rounded-[40px] text-center flex flex-col items-center relative overflow-hidden group hover:scale-105 transition-transform duration-500 ${S.panel} ${p.popular ? 'border-[#C6A649]/50 shadow-[0_0_50px_rgba(198,166,73,0.15)]' : ''}`}>
                      {p.popular && <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#C6A649] to-[#FBF5B7]"/>}
                      {p.popular && <div className="bg-[#C6A649]/20 text-[#C6A649] text-[8px] font-bold px-4 py-1 rounded-full uppercase tracking-widest mb-6 border border-[#C6A649]/30">Recomendado</div>}
                      <h3 className="text-xl font-bold text-white uppercase tracking-[0.2em] mb-2">{p.name}</h3>
                      <div className="text-5xl font-bold text-white mb-8 tracking-tighter">${price}<span className="text-sm font-normal text-white/30 ml-2">/mo</span></div>
                      <div className="w-full h-px bg-white/5 mb-8"></div>
                      <div className="space-y-5 mb-10 w-full text-left">
                          <div className="bg-white/5 p-3 rounded-xl flex items-center justify-center gap-3 border border-white/5 mb-6"><Zap size={14} className="text-[#C6A649]"/><span className="text-xs font-bold text-white uppercase tracking-widest">{p.creds} Créditos</span></div>
                          {p.feats.map(f => <div key={f} className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/60"><Check size={10} className="text-[#C6A649]"/> {f}</div>)}
                      </div>
                      <button onClick={()=>onSelect(k, annual)} className={`w-full py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] ${p.popular ? S.btnGold : 'bg-white/5 text-white hover:bg-white hover:text-black transition-all'}`}>Elegir Plan</button>
                  </div>
              );
          })}
      </div>
    </div>
  );
};

// --- APP WRAPPER (CEREBRO) ---
function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [influencers, setInfluencers] = useState<Talent[]>([]);
  const [credits, setCredits] = useState(0); 
  const [userPlan, setUserPlan] = useState<'starter' | 'creator' | 'agency'>('starter');
  const [toast, setToast] = useState<string|null>(null);
  const [selPlan, setSelPlan] = useState<{key: string, annual: boolean} | null>(null);
  const [profile, setProfile] = useState<UserProfile>({ name: "Agencia", email: "" });

  const notify = (msg: string) => setToast(msg);

  // Aseguramos que handleInf esté definido ANTES de que se use en el return
  const handleInf = {
      add: (inf:any) => { const n=[...influencers,inf]; setInfluencers(n); localStorage.setItem('lux_inf',JSON.stringify(n)); },
      del: (id:string) => { const n=influencers.filter(i=>i.id!==id); setInfluencers(n); localStorage.setItem('lux_inf',JSON.stringify(n)); }
  };

  useEffect(() => {
    try { const i=localStorage.getItem('lux_inf'); if(i) setInfluencers(JSON.parse(i)); } catch(e){}
    const t = setTimeout(() => setLoading(false), 2000); 
    supabase.auth.getSession().then(({data:{session}}) => { setSession(session); if(session) initData(session.user.id); else setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => { setSession(session); if(session) initData(session.user.id); else setLoading(false); });
    return () => { clearTimeout(t); subscription.unsubscribe(); };
  }, []);

  const initData = async (uid:string) => {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', uid).single();
      if(p) { setCredits(p.credits); setUserPlan(p.plan); setProfile({...p, email: session?.user?.email}); }
      const { data: v } = await supabase.from('generations').select('*').eq('user_id', uid).order('created_at', {ascending:false});
      if(v) setVideos(v.map((i:any)=>({id:i.id, url:i.video_url, date:new Date(i.created_at).toLocaleDateString(), aspectRatio:i.aspect_ratio, cost:i.cost})));
      setLoading(false);
  };

  const handleVideoSaved = async (videoData: any) => {
      setVideos(prev => [videoData, ...prev]);
  };

  const handleUpdateProfile = (p: UserProfile) => { setProfile(p); };
  const handleLogout = async () => { await supabase.auth.signOut(); };

  if(loading) return <div className="min-h-screen bg-[#030303] flex items-center justify-center"><Loader2 className="w-12 h-12 text-[#C6A649] animate-spin"/></div>;
  if(!session) return <LoginScreen onLogin={()=>{}}/>;

  return (
    <Router>
      <div className={S.bg}>
        {toast && <Toast msg={toast} onClose={()=>setToast(null)}/>}
        {selPlan && <CheckoutModal planKey={selPlan.key} annual={selPlan.annual} onClose={()=>setSelPlan(null)}/>}
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex w-80 flex-col p-10 border-r border-white/5 bg-[#0a0a0a] fixed h-full z-50">
            <div className="flex items-center gap-4 mb-16"><div className="w-12 h-12 bg-gradient-to-br from-[#C6A649] to-black rounded-2xl flex items-center justify-center shadow-lg"><Play fill="white" size={20} className="text-white ml-1"/></div><div><h1 className="text-xl font-bold tracking-[0.2em] leading-none text-white">LUXE<span className="block text-[8px] text-[#C6A649] mt-1 font-normal tracking-[0.4em]">MOTION PRO</span></h1></div></div>
            <nav className="space-y-4 flex-1">
                <Link to="/" className="flex items-center gap-5 p-4 rounded-2xl text-white/50 hover:text-white hover:bg-white/5 transition-all group"><LayoutDashboard size={20} className="group-hover:text-[#C6A649] transition-colors"/><span className="text-[10px] font-bold uppercase tracking-widest">Studio</span></Link>
                <Link to="/talent" className="flex items-center gap-5 p-4 rounded-2xl text-white/50 hover:text-white hover:bg-white/5 transition-all group"><Users size={20} className="group-hover:text-[#C6A649] transition-colors"/><span className="text-[10px] font-bold uppercase tracking-widest">Casting</span></Link>
                <Link to="/gallery" className="flex items-center gap-5 p-4 rounded-2xl text-white/50 hover:text-white hover:bg-white/5 transition-all group"><ImageIcon size={20} className="group-hover:text-[#C6A649] transition-colors"/><span className="text-[10px] font-bold uppercase tracking-widest">Portfolio</span></Link>
                <Link to="/billing" className="flex items-center gap-5 p-4 rounded-2xl text-white/50 hover:text-white hover:bg-white/5 transition-all group"><CreditCard size={20} className="group-hover:text-[#C6A649] transition-colors"/><span className="text-[10px] font-bold uppercase tracking-widest">Planes</span></Link>
                <Link to="/settings" className="flex items-center gap-5 p-4 rounded-2xl text-white/50 hover:text-white hover:bg-white/5 transition-all group"><Settings size={20} className="group-hover:text-[#C6A649] transition-colors"/><span className="text-[10px] font-bold uppercase tracking-widest">Ajustes</span></Link>
            </nav>
            <div onClick={() => setSelPlan({key:'creator', annual:true})} className="mt-auto bg-gradient-to-br from-[#111] to-black p-8 rounded-[32px] border border-white/5 group cursor-pointer hover:border-[#C6A649]/30 transition-all relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#C6A649]"></div>
                <div className="flex justify-between items-start mb-6"><span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Saldo Actual</span><div className="bg-[#C6A649]/10 px-3 py-1.5 rounded-lg text-[8px] font-bold text-[#C6A649] uppercase group-hover:bg-[#C6A649] group-hover:text-black transition-colors">Recargar</div></div>
                <div className="flex items-center gap-3"><span className="text-5xl font-bold text-white tracking-tighter">{credits}</span><Zap size={24} className="text-[#C6A649] fill-[#C6A649]"/></div>
            </div>
            <button onClick={handleLogout} className="mt-8 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-red-500/50 hover:text-red-500 pl-4 transition-colors"><LogOut size={16}/> Cerrar Sesión</button>
        </aside>

        {/* MOBILE HEADER */}
        <div className="lg:hidden fixed top-0 w-full p-4 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 z-50 flex justify-between items-center">
            <div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#C6A649] rounded-lg flex items-center justify-center text-black"><Play fill="black" size={14}/></div><span className="text-sm font-bold tracking-[0.2em] text-white">LUXE</span></div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full"><span className="text-xs font-bold text-white">{credits}</span><Zap size={12} className="text-[#C6A649] fill-[#C6A649]"/></div>
        </div>

        {/* CONTENT */}
        <main className="lg:ml-80 min-h-screen pt-20 lg:pt-0">
            <Routes>
                <Route path="/" element={<StudioPage onGen={handleVideoSaved} influencers={influencers} credits={credits} notify={notify} onUp={()=>setSelPlan({key:'creator', annual:true})} userPlan={userPlan} talents={influencers}/>}/>
                <Route path="/talent" element={<TalentPage list={influencers} add={handleInf.add} del={handleInf.del} notify={notify}/>}/>
                <Route path="/gallery" element={<GalleryPage videos={videos}/>}/>
                <Route path="/billing" element={<BillingPage onSelect={(k:string, a:boolean)=>setSelPlan({key:k, annual:a})}/>}/>
                <Route path="/settings" element={<SettingsPage credits={credits} profile={profile} setProfile={handleUpdateProfile} notify={notify}/>}/>
            </Routes>
        </main>

        {/* MOBILE NAV */}
        <div className="lg:hidden fixed bottom-0 w-full bg-[#0a0a0a] border-t border-white/10 flex justify-around p-2 pb-6 z-50">
            <Link to="/" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1"><LayoutDashboard size={20}/><span className="text-[8px] uppercase font-bold">Studio</span></Link>
            <Link to="/talent" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1"><Users size={20}/><span className="text-[8px] uppercase font-bold">Casting</span></Link>
            <Link to="/gallery" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1"><ImageIcon size={20}/><span className="text-[8px] uppercase font-bold">Galeria</span></Link>
            <Link to="/billing" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1"><CreditCard size={20}/><span className="text-[8px] uppercase font-bold">Plan</span></Link>
            <Link to="/settings" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1"><Settings size={20}/><span className="text-[8px] uppercase font-bold">Ajustes</span></Link>
        </div>
      </div>
    </Router>
  );
}

export default App;