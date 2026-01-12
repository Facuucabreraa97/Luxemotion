import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Loader2, Play, Sparkles, ChevronDown, ChevronRight, Mail, Lock, Upload, X, Plus, User,
  Briefcase, Camera, ShoppingBag, Globe, Download, Zap, Check, Video, Users,
  Image as ImageIcon, CreditCard, Settings, LogOut, Crown, Film, Move, ZoomIn,
  Heart, Smartphone, Monitor, Square, Flame, LayoutDashboard, Info
} from 'lucide-react';
import { createClient, Session } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';
import './i18n';

// --- CONFIGURATION ---
const CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder',
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
};

// --- STYLES ---
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

// --- TYPES ---
export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
  SQUARE = '1:1'
}

export enum Resolution {
  HD = '720p',
  FHD = '1080p'
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  instagram?: string;
  telegram?: string;
  avatar?: string | null;
  credits?: number;
  plan?: 'starter' | 'creator' | 'agency';
  is_admin?: boolean;
}

export interface Talent {
  id: string;
  name: string;
  image_url: string;
  notes?: string;
  role?: string;
  dna_prompt?: string;
  user_id?: string;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  date: string;
  aspectRatio: string;
  cost: number;
  is_public?: boolean;
}

// --- CONSTANTS ---
interface PricingTier {
  name: string;
  creds: number;
  price: number;
  yearlyPrice?: number;
  popular?: boolean;
  feats: string[];
}

const PRICING: Record<string, PricingTier> = {
  starter: { name: "Starter", creds: 50, price: 0, feats: ["Calidad HD", "1 Modelo", "Marca de Agua", "Soporte Básico"] },
  creator: { name: "Influencer", creds: 1000, price: 29, yearlyPrice: 24, popular: true, feats: ["4K Ultra", "Velvet Mode", "5 Modelos", "Licencia Comercial", "Sin Marca de Agua"] },
  agency: { name: "Agency", creds: 5000, price: 99, yearlyPrice: 79, feats: ["Todo Ilimitado", "API Access", "Prioridad Total", "Account Manager", "Soporte 24/7"] }
};

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
  { id: 'leaked', name: 'Leaked Tape', desc: 'Raw & Amateur' },
  { id: 'boudoir', name: 'Glamour', desc: 'Cinematic & Spicy' },
  { id: 'cosplay', name: 'Cosplay', desc: 'Anime Realism' },
];

const ONBOARDING_STEPS = [
    { target: 'studio-source-upload', text: "Upload your model's photo here", pos: 'right' },
    { target: 'studio-product-upload', text: "Upload what you want to sell here (or leave it empty)", pos: 'left' },
    { id: 'mode-switch', text: "Activate this for special modes (Requires a Plan)", pos: 'bottom' },
    { target: 'studio-generate-btn', text: "Create your video", pos: 'top' }
];

// --- SUPABASE ---
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// --- CONTEXTS ---
type Mode = 'velvet' | 'agency';

interface ModeContextType {
  mode: Mode;
  toggleMode: () => void;
  setMode: (mode: Mode) => void;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    panel: string;
  };
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

const ModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<Mode>('agency');

  const toggleMode = () => {
    setModeState(prev => prev === 'velvet' ? 'agency' : 'velvet');
  };

  const setMode = (m: Mode) => setModeState(m);

  const theme = mode === 'velvet'
    ? { primary: '#C6A649', secondary: '#EC4899', accent: '#9333EA', bg: 'bg-[#030303]', panel: S.panel }
    : { primary: '#3B82F6', secondary: '#64748B', accent: '#0F172A', bg: 'bg-white text-black', panel: 'bg-white border border-gray-200 shadow-xl text-black' };

  return (
    <ModeContext.Provider value={{ mode, toggleMode, setMode, theme }}>
      {children}
    </ModeContext.Provider>
  );
};

const useMode = () => {
  const context = useContext(ModeContext);
  if (!context) throw new Error("useMode must be used within a ModeProvider");
  return context;
};

// Toast Context
type ToastType = 'success' | 'error' | 'info';
interface ToastContextType { showToast: (msg: string, type?: ToastType) => void; }
const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{msg: string, type: ToastType} | null>(null);

  const showToast = (msg: string, type: ToastType = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && createPortal(
        <div className={`fixed top-4 right-4 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 border backdrop-blur-md
          ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-500' :
            toast.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-500' :
            'bg-black/80 border-[#C6A649]/30 text-[#C6A649]'}`}>
          {toast.type === 'error' ? <X size={18}/> : toast.type === 'success' ? <Check size={18}/> : <Info size={18}/>}
          <span className="text-xs font-bold uppercase tracking-widest">{toast.msg}</span>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

// --- COMPONENTS ---

const Tooltip = ({ txt }: { txt: string }) => (
  <div className="group relative inline-flex ml-2 cursor-help align-middle z-50">
    <Info size={14} className="text-white/30 hover:text-[#C6A649] transition-colors"/>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 bg-[#111] border border-[#C6A649]/30 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-[10px] text-gray-300 text-center pointer-events-none shadow-xl backdrop-blur-md">
      {txt}
    </div>
  </div>
);

const VelvetModal = ({ onClose, onOk }: { onClose: () => void, onOk: () => void }) => (
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

const VelvetBenefitsModal: React.FC<{ onClose: () => void; onUnlock: () => void }> = ({ onClose, onUnlock }) => {
  const benefits = ['Uncensored', 'Hyperrealistic Skin (8K)', 'Exclusive Models', 'Priority Generation'];
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-in zoom-in duration-300">
      <div className="w-full max-w-sm relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-900 opacity-40 blur-2xl rounded-[40px]"></div>
        <div className="bg-[#050505] relative rounded-[32px] p-8 text-center border border-pink-500/20 shadow-2xl overflow-hidden">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors z-10"><X size={20} /></button>
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-tr from-pink-600 to-purple-900 rounded-full flex items-center justify-center border border-pink-500/50 shadow-[0_0_30px_rgba(236,72,153,0.3)] animate-pulse relative z-10">
            <Lock size={32} className="text-white fill-white/20" />
          </div>
          <h2 className="text-sm font-bold text-white/70 uppercase tracking-[0.2em] mb-1 relative z-10">Enter the</h2>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400 uppercase tracking-[0.2em] mb-8 relative z-10 drop-shadow-sm">Velvet Side</h2>
          <div className="space-y-4 mb-8 text-left pl-6 relative z-10">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-4 group/item">
                <div className="p-1 rounded-full bg-gradient-to-br from-[#C6A649] to-[#FCD34D] text-black shadow-[0_0_10px_rgba(198,166,73,0.3)]"><Check size={12} strokeWidth={4} /></div>
                <span className="text-sm font-medium text-gray-300 tracking-wide group-hover/item:text-white transition-colors">{benefit}</span>
              </div>
            ))}
          </div>
          <button onClick={onUnlock} className={`w-full py-4 text-sm ${S.btnVelvet} relative z-10 shadow-[0_0_20px_rgba(236,72,153,0.5)]`}>UNLOCK FULL ACCESS</button>
        </div>
      </div>
    </div>
  );
};

const StudioOnboarding = () => {
    const [step, setStep] = useState(0);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [visible, setVisible] = useState(false);
    const { mode } = useMode();

    useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenStudioOnboarding_v1');
        if (!hasSeen) { setTimeout(() => setVisible(true), 1000); }
    }, []);

    const updateRect = () => {
        const currentStep = ONBOARDING_STEPS[step];
        let targetId = currentStep.target;
        if (currentStep.id === 'mode-switch') {
            const sidebar = document.getElementById('sidebar-mode-toggle');
            const mobile = document.getElementById('mobile-mode-toggle');
            if (sidebar && getComputedStyle(sidebar).display !== 'none') { targetId = 'sidebar-mode-toggle'; }
            else if (mobile) { targetId = 'mobile-mode-toggle'; }
        }
        if (targetId) {
            const el = document.getElementById(targetId);
            if (el) { setRect(el.getBoundingClientRect()); }
        }
    };

    useEffect(() => {
        if (!visible) return;
        updateRect();
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);
        return () => {
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
        };
    }, [step, visible]);

    const handleNext = () => {
        if (step < ONBOARDING_STEPS.length - 1) { setStep(s => s + 1); } else { handleClose(); }
    };
    const handleClose = () => { setVisible(false); localStorage.setItem('hasSeenStudioOnboarding_v1', 'true'); };
    if (!visible || !rect) return null;

    const currentStep = ONBOARDING_STEPS[step];
    const tooltipStyle: React.CSSProperties = {};
    const PADDING = 20;

    if (currentStep.pos === 'right') {
        tooltipStyle.left = rect.right + PADDING; tooltipStyle.top = rect.top + (rect.height / 2) - 40;
    } else if (currentStep.pos === 'left') {
        tooltipStyle.right = window.innerWidth - rect.left + PADDING; tooltipStyle.top = rect.top + (rect.height / 2) - 40;
    } else if (currentStep.pos === 'bottom') {
        tooltipStyle.left = rect.left + (rect.width / 2) - 100; tooltipStyle.top = rect.bottom + PADDING;
    } else if (currentStep.pos === 'top') {
        tooltipStyle.left = rect.left + (rect.width / 2) - 100; tooltipStyle.bottom = window.innerHeight - rect.top + PADDING;
    }

    if (window.innerWidth < 768) {
        tooltipStyle.left = 20; tooltipStyle.right = 20;
        if (rect.top > window.innerHeight / 2) { tooltipStyle.bottom = window.innerHeight - rect.top + 20; tooltipStyle.top = 'auto'; }
        else { tooltipStyle.top = rect.bottom + 20; tooltipStyle.bottom = 'auto'; }
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden">
            <div className="absolute transition-all duration-500 ease-in-out rounded-xl" style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height, boxShadow: '0 0 0 9999px rgba(0,0,0,0.85)', border: mode === 'velvet' ? '2px solid #C6A649' : '2px solid white' }}/>
            <div className="absolute z-[10000] transition-all duration-500 ease-in-out" style={tooltipStyle}>
                <div className={`w-64 p-5 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300 ${mode === 'velvet' ? 'bg-[#1a1a1a] border border-[#C6A649]/30 text-white' : 'bg-white text-gray-900'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${mode === 'velvet' ? 'text-[#C6A649]' : 'text-blue-600'}`}>Step {step + 1}/{ONBOARDING_STEPS.length}</span>
                        <button onClick={handleClose} className="opacity-50 hover:opacity-100 transition-opacity"><X size={14} /></button>
                    </div>
                    <p className="text-sm font-medium leading-relaxed mb-6">{currentStep.text}</p>
                    <div className="flex justify-end">
                        <button onClick={handleNext} className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-transform hover:scale-105 ${mode === 'velvet' ? 'bg-[#C6A649] text-black' : 'bg-black text-white'}`}>
                            {step === ONBOARDING_STEPS.length - 1 ? 'Finish' : 'Next'}
                            {step === ONBOARDING_STEPS.length - 1 ? <Check size={12}/> : <ChevronRight size={12}/>}
                        </button>
                    </div>
                </div>
            </div>
        </div>, document.body
    );
};

interface CheckoutModalProps { planKey: string; annual: boolean; onClose: () => void; }
const CheckoutModal = ({ planKey, annual, onClose }: CheckoutModalProps) => {
  const { mode } = useMode();
  const plan = PRICING[planKey];
  const price = annual && plan.yearlyPrice ? plan.yearlyPrice : plan.price;
  const [load, setLoad] = useState(false);
  const [currency, setCurrency] = useState<'USDT' | 'ARS'>('ARS');

  const handleCheckout = async () => {
      if (currency === 'USDT') {
          alert("Crypto payments are temporarily unavailable. Please use Mercado Pago.");
          return;
      }
      setLoad(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if(!session) return;

        // Calculate price to send.
        // If ARS, we want to charge exactly what is displayed (price * 1500).
        // We send currency: 'ARS' so backend skips conversion.
        const payloadPrice = currency === 'ARS' ? price * 1500 : price;
        const payloadCurrency = currency;

        const res = await fetch(`${CONFIG.API_URL}/create-preference`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify({
                title: `LuxeMotion ${plan.name}`,
                price: payloadPrice,
                quantity: 1,
                type: planKey,
                currency: payloadCurrency
            })
        });
        const data = await res.json();
        if(data.id) {
            // @ts-ignore
            const mp = new window.MercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, { locale: 'es-AR' });
            mp.checkout({ preference: { id: data.id }, autoOpen: true });
        }
      } catch(e) { console.error(e); } finally { setLoad(false); }
  };

  const displayPrice = currency === 'ARS' ? (price * 1500).toLocaleString('es-AR') : price;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-[40px] relative overflow-hidden ${mode==='velvet'?'bg-[#0a0a0a] border border-white/10':'bg-white'}`}>
          <button onClick={onClose} className="absolute top-6 right-6 z-10 p-2 bg-black/10 rounded-full hover:bg-black/20"><X size={18} className={mode==='velvet'?'text-white':'text-black'}/></button>
          <div className="p-10 text-center">
              <div className="flex justify-center gap-2 mb-8">
                  <button onClick={() => setCurrency('USDT')} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${currency === 'USDT' ? (mode === 'velvet' ? 'bg-[#C6A649] text-black' : 'bg-black text-white') : (mode === 'velvet' ? 'bg-white/5 text-gray-500 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-black')}`}>USDT / Crypto</button>
                  <button onClick={() => setCurrency('ARS')} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${currency === 'ARS' ? (mode === 'velvet' ? 'bg-[#C6A649] text-black' : 'bg-black text-white') : (mode === 'velvet' ? 'bg-white/5 text-gray-500 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-black')}`}>Pesos (ARS)</button>
              </div>
              <h2 className={`text-2xl font-bold uppercase tracking-widest mb-2 ${mode==='velvet'?'text-white':'text-black'}`}>{plan.name}</h2>
              <div className={`text-5xl font-bold mb-8 ${mode==='velvet'?'text-[#C6A649]':'text-black'}`}>${displayPrice}<span className="text-sm font-normal text-gray-500">/mo</span></div>
              <ul className="space-y-4 mb-8 text-left">
                  {plan.feats.map(f=><li key={f} className={`flex items-center gap-3 text-xs uppercase tracking-widest ${mode==='velvet'?'text-gray-400':'text-gray-600'}`}><Check size={14} className="text-[#C6A649]"/> {f}</li>)}
              </ul>
              <div className="border-t border-gray-800 pt-6 mb-6">
                <details className={`text-left text-[10px] ${mode==='velvet'?'text-gray-500':'text-gray-400'}`}>
                    <summary className="cursor-pointer hover:text-gray-300 mb-2">Terms & Conditions</summary>
                    <p>Subscription renews automatically. Cancel anytime. Content ownership belongs to you.</p>
                </details>
              </div>
              <button onClick={handleCheckout} disabled={load} className={`w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-widest ${S.btnGold}`}>{load ? "Procesando..." : (currency === 'ARS' ? "Pay with Mercado Pago" : "Pay with Crypto")}</button>
          </div>
      </div>
    </div>
  );
};

const MobileHeader = ({ credits, userProfile, onUpgrade }: any) => {
  const { mode, setMode } = useMode();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const handleModeToggle = () => {
    if (mode === 'velvet') { setMode('agency'); } else {
      const canAccess = userProfile?.is_admin || userProfile?.plan === 'creator' || userProfile?.plan === 'agency';
      if (canAccess) { setMode('velvet'); } else { setShowUpgradeModal(true); }
    }
  };

  return (
    <>
      {showUpgradeModal && <CheckoutModal planKey="creator" annual={true} onClose={() => setShowUpgradeModal(false)} />}
      <div className={`lg:hidden fixed top-0 w-full p-4 border-b z-50 flex justify-between items-center transition-colors ${mode === 'velvet' ? 'bg-[#0a0a0a]/90 backdrop-blur-md border-white/5' : 'bg-white/90 backdrop-blur-md border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mode === 'velvet' ? 'bg-[#C6A649] text-black' : 'bg-blue-600 text-white'}`}><Play fill={mode === 'velvet' ? "black" : "white"} size={14}/></div>
            <span className={`text-sm font-bold tracking-[0.2em] ${mode === 'velvet' ? 'text-white' : 'text-gray-900'}`}>LUXE</span>
          </div>
          <div className="flex items-center gap-3">
             <button id="mobile-mode-toggle" onClick={handleModeToggle} className={`relative w-12 h-6 rounded-full border transition-all ${mode==='velvet'?'bg-black border-white/20':'bg-gray-200 border-gray-300'}`}>
                <div className={`absolute top-0.5 bottom-0.5 w-5 rounded-full shadow-sm transition-transform duration-300 ${mode==='velvet' ? 'translate-x-6 bg-[#C6A649]' : 'translate-x-0.5 bg-white'}`}></div>
             </button>
             <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${mode === 'velvet' ? 'bg-white/10' : 'bg-gray-100'}`}>
                <span className={`text-xs font-bold ${mode === 'velvet' ? 'text-white' : 'text-gray-900'}`}>{userProfile?.is_admin ? '∞' : credits}</span>
                <Zap size={12} className={mode === 'velvet' ? 'text-[#C6A649] fill-[#C6A649]' : 'text-blue-500 fill-blue-500'}/>
             </div>
          </div>
      </div>
    </>
  );
};

const MobileNav = () => (
  <div className="lg:hidden fixed bottom-0 w-full bg-[#0a0a0a] border-t border-white/10 flex justify-around p-2 pb-6 z-50">
      <NavLink to="/app" end className={({isActive})=>`p-3 flex flex-col items-center gap-1 ${isActive?'text-[#C6A649]':'text-white/50'}`}><LayoutDashboard size={20}/><span className="text-[8px] uppercase font-bold">Studio</span></NavLink>
      <NavLink to="/app/explore" className={({isActive})=>`p-3 flex flex-col items-center gap-1 ${isActive?'text-[#C6A649]':'text-white/50'}`}><Globe size={20}/><span className="text-[8px] uppercase font-bold">Explore</span></NavLink>
      <NavLink to="/app/talent" className={({isActive})=>`p-3 flex flex-col items-center gap-1 ${isActive?'text-[#C6A649]':'text-white/50'}`}><Users size={20}/><span className="text-[8px] uppercase font-bold">Casting</span></NavLink>
      <NavLink to="/app/gallery" className={({isActive})=>`p-3 flex flex-col items-center gap-1 ${isActive?'text-[#C6A649]':'text-white/50'}`}><ImageIcon size={20}/><span className="text-[8px] uppercase font-bold">Galeria</span></NavLink>
      <NavLink to="/app/billing" className={({isActive})=>`p-3 flex flex-col items-center gap-1 ${isActive?'text-[#C6A649]':'text-white/50'}`}><CreditCard size={20}/><span className="text-[8px] uppercase font-bold">Plan</span></NavLink>
      <NavLink to="/app/settings" className={({isActive})=>`p-3 flex flex-col items-center gap-1 ${isActive?'text-[#C6A649]':'text-white/50'}`}><Settings size={20}/><span className="text-[8px] uppercase font-bold">Ajustes</span></NavLink>
  </div>
);

const Sidebar = ({ credits, onLogout, onUp, userProfile, onUpgrade, notify }: any) => {
  const { pathname } = useLocation();
  const { mode, toggleMode, setMode } = useMode();
  const { t, i18n } = useTranslation();
  const [showVelvetBenefits, setShowVelvetBenefits] = React.useState(false);

  const links = [
    { icon: Video, label: t('common.nav.studio'), path: '/app' },
    { icon: Globe, label: 'Explore', path: '/app/explore' },
    { icon: Users, label: t('common.nav.talent'), path: '/app/talent' },
    { icon: ImageIcon, label: t('common.nav.gallery'), path: '/app/gallery' },
    { icon: CreditCard, label: t('common.nav.billing'), path: '/app/billing' },
    { icon: Settings, label: t('common.nav.settings'), path: '/app/settings' },
  ];

  const handleLang = () => { i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es'); };
  const handleModeToggle = () => {
    if (mode === 'velvet') {
        setMode('agency');
    } else {
      if (userProfile?.plan === 'starter' && !userProfile?.is_admin) {
          onUpgrade();
          return;
      }
      setMode('velvet');
      notify('High Fidelity Mode activated.');
    }
  };

  return (
    <>
      {showVelvetBenefits && <VelvetBenefitsModal onClose={() => setShowVelvetBenefits(false)} onUnlock={() => { setShowVelvetBenefits(false); onUpgrade(); }} />}
      <aside className={`fixed left-0 top-0 h-screen w-80 flex flex-col hidden lg:flex border-r transition-all duration-500 z-50 ${mode === 'velvet' ? 'bg-black/95 border-white/5 backdrop-blur-xl' : 'bg-[#F8F9FA] border-gray-200'}`}>
        <div className="p-8 pb-4">
          {mode === 'velvet' ? <h1 className="text-2xl font-bold tracking-[0.2em] uppercase mb-1 text-white">Luxe<span className="text-[#C6A649]">Motion</span></h1> : <h1 className="text-2xl font-bold tracking-[0.2em] uppercase mb-1 text-black">LuxeMotion</h1>}
          <div className="flex items-center justify-between"><p className="text-[9px] text-gray-500 uppercase tracking-[0.4em] font-bold">AI Video Generator</p><button onClick={handleLang} className={`text-[9px] font-bold uppercase px-2 py-1 rounded border transition-colors ${mode==='velvet'?'border-white/10 text-gray-400 hover:text-white':'border-gray-300 text-gray-500 hover:text-black hover:border-gray-400'}`}>{i18n.language.toUpperCase()}</button></div>
        </div>
        <div className="px-8 mb-6">
          <button id="sidebar-mode-toggle" onClick={handleModeToggle} className={`w-full p-1 rounded-full border flex items-center relative overflow-hidden group transition-all duration-500 ${mode==='velvet' ? 'bg-black border-white/10' : 'bg-gray-200 border-gray-300'}`}>
              <div className={`w-1/2 text-[9px] font-bold uppercase text-center py-2 rounded-full relative z-10 transition-colors ${mode==='velvet'?'text-white':'text-gray-500'}`}>Velvet</div>
              <div className={`w-1/2 text-[9px] font-bold uppercase text-center py-2 rounded-full relative z-10 transition-colors ${mode==='agency'?'text-black':'text-gray-500'}`}>Agency</div>
              <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-transform duration-500 ease-out shadow-lg ${mode==='velvet' ? 'translate-x-1 bg-[#C6A649]' : 'translate-x-[calc(100%+4px)] bg-white'}`}></div>
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {links.map((l) => {
             const active = pathname === l.path;
             const containerClass = active ? (mode === 'velvet' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm') : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5';
             const iconColor = active ? (mode === 'velvet' ? 'text-[#C6A649]' : 'text-black') : (mode === 'velvet' ? 'text-gray-600 group-hover:text-white' : 'text-gray-400 group-hover:text-black');
             const textColor = active ? (mode === 'velvet' ? 'text-white' : 'text-black') : (mode === 'velvet' ? 'text-gray-500 group-hover:text-white' : 'text-gray-500 group-hover:text-black');
             return (
              <NavLink key={l.path} to={l.path} end={l.path==='/app'} className={`flex items-center gap-4 px-6 py-4 rounded-2xl border transition-all duration-300 group relative overflow-hidden ${containerClass}`}>
                <l.icon size={18} className={`transition-colors duration-300 ${iconColor}`} />
                <span className={`text-[11px] font-bold uppercase tracking-widest ${textColor}`}>{l.label}</span>
                {active && <ChevronRight size={14} className={`absolute right-4 ${mode==='velvet'?'text-[#C6A649]':'text-black'}`}/>}
              </NavLink>
            );
          })}
        </nav>
        <div className={`p-6 m-4 rounded-[2rem] border relative overflow-hidden group transition-all duration-500 ${mode==='velvet'?'bg-gradient-to-br from-[#1a1a1a] to-black border-white/10':'bg-white border-gray-200 shadow-lg'}`}>
          <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${mode==='velvet'?'text-[#C6A649]':'text-black'}`}><Zap size={80}/></div>
          <div className="relative z-10">
              <p className={`text-[9px] uppercase font-bold tracking-widest mb-2 ${mode==='velvet'?'text-gray-400':'text-gray-500'}`}>Créditos Disponibles</p>
              <div className={`text-4xl font-bold mb-4 flex items-baseline gap-1 ${mode==='velvet'?'text-white':'text-black'}`}>{userProfile?.is_admin ? '∞' : credits}<span className="text-sm font-normal text-gray-500">cr</span></div>
              <button onClick={onUp} className={`w-full py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg ${mode==='velvet' ? 'bg-[#C6A649] text-black hover:bg-[#d4b55b]' : 'bg-black text-white hover:bg-gray-800'}`}>
                  <Crown size={14}/> Recargar
              </button>
          </div>
        </div>
        <div className="px-8 pb-8"><button onClick={onLogout} className="flex items-center gap-3 text-[10px] font-bold uppercase text-red-500/50 hover:text-red-500 transition-colors tracking-widest pl-2"><LogOut size={14}/> Cerrar Sesión</button></div>
      </aside>
    </>
  );
};

// --- PAGES ---

const ExplorePage = () => {
    const { mode } = useMode();
    const [tab, setTab] = useState<'community' | 'marketplace'>('community');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setItems([]);
        setError(null);

        const fetchData = async () => {
            try {
                if (tab === 'community') {
                    const res = await fetch(`${CONFIG.API_URL}/explore`);
                    if (!res.ok) throw new Error('Network response was not ok');
                    const data = await res.json();
                    if (active) setItems(data);
                } else {
                    const { data: { user } } = await supabase.auth.getUser();
                    const { data, error } = await supabase
                        .from('talents')
                        .select('*, profiles(name, avatar)')
                        .eq('is_for_sale', true)
                        .neq('user_id', user?.id || ''); // Verify not filtering by user_id (showing others)

                    if (error) throw error;
                    if (active) setItems(data || []);
                }
            } catch (err) {
                console.error(err);
                if (active && tab === 'community') {
                     setError('The marketplace is closed for maintenance / No public content yet.');
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchData();
        return () => { active = false; };
    }, [tab]);

    const placeholders = Array(9).fill(0);

    return (
        <div className={`p-6 lg:p-12 animate-in fade-in pb-32`}>
            <div className="flex items-center justify-between mb-12">
                <h2 className={`text-4xl font-bold uppercase tracking-[0.2em] ${mode==='velvet'?'text-white':'text-gray-900'}`}>Explore</h2>
                <div className={`p-1 rounded-full border flex ${mode==='velvet'?'bg-black/40 border-white/10':'bg-gray-100 border-gray-200'}`}>
                    <button onClick={()=>setTab('community')} className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase transition-all ${tab==='community' ? (mode==='velvet'?'bg-[#C6A649] text-black shadow-lg':'bg-black text-white shadow-lg') : 'text-gray-400 hover:text-white'}`}>Community</button>
                    <button onClick={()=>setTab('marketplace')} className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase transition-all ${tab==='marketplace' ? (mode==='velvet'?'bg-[#C6A649] text-black shadow-lg':'bg-black text-white shadow-lg') : 'text-gray-400 hover:text-white'}`}>Marketplace</button>
                </div>
            </div>

            {error ? (
                <div className={`p-12 rounded-3xl border text-center ${mode === 'velvet' ? 'bg-white/5 border-white/10 text-white/50' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                    <p className="uppercase tracking-widest text-xs font-bold">{error}</p>
                </div>
            ) : (
                <>
                    {items.length === 0 && !loading && tab === 'marketplace' && (
                         <div className={`p-12 rounded-3xl border text-center ${mode === 'velvet' ? 'bg-white/5 border-white/10 text-white/50' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                            <p className="uppercase tracking-widest text-xs font-bold">No talents for sale yet</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loading ? placeholders.map((_, i) => (
                            <div key={i} className={`aspect-[9/16] rounded-[30px] animate-pulse ${mode==='velvet'?'bg-white/5':'bg-gray-200'}`}></div>
                        )) : items.map((item: any) => (
                             <div key={item.id} className={`rounded-[30px] overflow-hidden group relative hover:-translate-y-2 transition-all ${mode==='velvet'?S.panel:'bg-white shadow-lg border border-gray-100'}`}>
                            {item.type === 'video' || (item.video_url && item.video_url.endsWith('.mp4')) ? (
                                    <video src={item.video_url} className="aspect-[9/16] object-cover w-full" controls />
                                ) : (
                                    <img src={item.image_url} className="aspect-[3/4] object-cover w-full" />
                                )}
                                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
                                    <p className="text-white text-[10px] font-bold uppercase tracking-widest">{item.profiles?.name || 'Unknown'}</p>
                                    {tab === 'marketplace' && <div className="bg-[#C6A649] text-black px-3 py-1 rounded-full text-[9px] font-bold uppercase">{item.price} CR</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const LANDING_VID = "https://videos.pexels.com/video-files/3205917/3205917-hd_1920_1080_25fps.mp4";
  return (
    <div className="bg-black min-h-screen text-white font-sans overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2"><div className="w-8 h-8 bg-[#C6A649]/10 rounded-lg flex items-center justify-center border border-[#C6A649]/20"><Play fill="#C6A649" className="text-[#C6A649] w-4 h-4 ml-0.5"/></div><div><h1 className="text-sm font-bold tracking-widest text-[#C6A649]">LUXE</h1></div></div>
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="text-xs uppercase tracking-widest text-white/70 hover:text-white transition-colors">Log In</button>
            <button onClick={() => navigate('/login?mode=register')} className="bg-[#C6A649] text-black text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full hover:bg-[#D4B355] transition-colors">Get Started</button>
        </div>
      </nav>
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0"><video src={LANDING_VID} autoPlay loop muted className="w-full h-full object-cover"/><div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black"></div></div>
        <div className="relative z-10 container mx-auto px-6 text-center mt-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm"><Sparkles size={12} className="text-[#C6A649]" /><span className="text-[10px] uppercase tracking-[0.2em] text-[#C6A649]">The Future of Content</span></div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium text-white mb-6 leading-tight">Luxe<span className="text-[#C6A649] italic">Motion</span></h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto mb-10 font-light leading-relaxed">From Ecommerce to Velvet: Create Viral Content in Seconds.</p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <button onClick={() => navigate('/login?mode=register')} className={`px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest ${S.btnGold} min-w-[200px]`}>Get Started for Free</button>
                <button className="px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm min-w-[200px]" onClick={() => document.getElementById('velvet-teaser')?.scrollIntoView({ behavior: 'smooth' })}>View Demo</button>
            </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce"><ChevronDown className="text-white/30" /></div>
      </section>
      <section id="velvet-teaser" className="py-32 relative overflow-hidden bg-black">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
            <h2 className="text-3xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white mb-8">Unlock the power of <br/><span className="italic text-purple-400">unrestricted content</span></h2>
            <p className="text-white/50 max-w-lg mx-auto mb-12 leading-loose">Experience the Velvet Mode. Designed for creators who demand freedom and elegance. Generate high-end aesthetics without boundaries.</p>
            <div className="relative inline-block group cursor-pointer">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#C6A649] to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <button onClick={() => navigate('/login?mode=register')} className="relative px-8 py-4 bg-black border border-white/10 rounded-lg leading-none flex items-center divide-x divide-gray-600"><span className="flex items-center space-x-5"><span className="pr-6 text-gray-100 uppercase tracking-widest text-xs">Access Velvet Mode</span></span><span className="pl-6 text-purple-400 group-hover:text-purple-300 transition duration-200">&rarr;</span></button>
            </div>
        </div>
      </section>
    </div>
  );
};

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [searchParams] = useSearchParams();
  const m = searchParams.get('mode');

  const [load, setLoad] = useState(false);
  const [mode, setMode] = useState<'login'|'register'|'forgot'>((m as any) === 'register' || (m as any) === 'forgot' ? (m as any) : 'login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoad(true); setErrorMsg(null);
    try {
        if(mode === 'register') {
            const { error } = await supabase.auth.signUp({ email, password: pass });
            if(error) setErrorMsg(error.message); else alert("Revisa tu email para confirmar.");
        } else if (mode === 'login') {
            const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
            if(error) setErrorMsg(error.message);
        } else {
            const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/settings?mode=reset' });
            if(error) setErrorMsg(error.message); else alert("Correo de recuperación enviado.");
        }
    } catch(e) { setErrorMsg("Error de conexión"); }
    setLoad(false);
  };
  const LOGIN_VID = "https://videos.pexels.com/video-files/3205917/3205917-hd_1920_1080_25fps.mp4";

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[100]">
      <video src={LOGIN_VID} autoPlay loop muted className="absolute inset-0 w-full h-full object-cover opacity-40"/>
      <div className={`relative z-10 w-full max-w-xs p-10 rounded-[40px] text-center ${S.panel}`}>
        <div className="mb-10"><div className="w-16 h-16 bg-[#C6A649]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#C6A649]/20 shadow-lg"><Play fill="#C6A649" className="text-[#C6A649] w-8 h-8 ml-1"/></div><h1 className={S.titleLuxe}>LUXE</h1><p className={S.subLuxe}>MOTION PRO</p></div>
        {errorMsg && <div className="mb-4 text-red-500 text-[10px] font-bold uppercase">{errorMsg}</div>}
        {mode !== 'forgot' ? (
            <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 bg-black/50 border border-white/10 p-4 rounded-2xl focus-within:border-[#C6A649] transition-colors"><Mail size={18} className="text-white/30"/><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="bg-transparent text-white text-xs w-full outline-none placeholder:text-white/20"/></div>
                <div className="flex items-center gap-4 bg-black/50 border border-white/10 p-4 rounded-2xl focus-within:border-[#C6A649] transition-colors"><Lock size={18} className="text-white/30"/><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Pass" className="bg-transparent text-white text-xs w-full outline-none placeholder:text-white/20"/></div>
            </div>
        ) : (
            <div className="mb-8 text-left"><p className="text-xs text-white/60 mb-4 px-1">Recuperar acceso.</p><div className="flex items-center gap-4 bg-black/50 border border-white/10 p-4 rounded-2xl"><Mail size={18} className="text-white/30"/><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="bg-transparent text-white text-xs w-full outline-none"/></div></div>
        )}
        <button onClick={handleSubmit} disabled={load} className={`w-full py-5 rounded-2xl text-[10px] ${S.btnGold}`}>{load ? "..." : (mode === 'login' ? "Entrar" : mode === 'register' ? "Crear" : "Enviar")}</button>
        <div className="mt-8 flex justify-between text-[9px] text-white/40 uppercase tracking-widest border-t border-white/5 pt-6">
            {mode === 'login' ? (<><button onClick={()=>setMode('register')} className="hover:text-white">Crear Cuenta</button><button onClick={()=>setMode('forgot')} className="hover:text-white">Recuperar</button></>) : (<button onClick={()=>setMode('login')} className="w-full hover:text-white">Volver</button>)}
        </div>
      </div>
    </div>
  );
};

const TalentPage = ({ list, add, del, notify, videos }: any) => {
  const { mode } = useMode();
  const { t } = useTranslation();
  const [img, setImg] = useState<string|null>(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [role, setRole] = useState('model');
  const [open, setOpen] = useState(false);
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [sellPrice, setSellPrice] = useState<string>('');
  const [showGallery, setShowGallery] = useState(false);
  const [isForSale, setIsForSale] = useState(false);
  const [createPrice, setCreatePrice] = useState('');

  const save = () => {
      if(img && name) {
        add({
            id:Date.now().toString(),
            name,
            image_url:img,
            role,
            notes,
            for_sale: isForSale,
            price: isForSale ? parseInt(createPrice) : 0
        });
        setOpen(false);
        setImg(null);
        setName('');
        setNotes('');
        setIsForSale(false);
        setCreatePrice('');
        notify("Persona Added");
      }
  };
  const handleSell = async (id: string) => {
      if (!sellPrice) return;
      try {
          const { error } = await supabase.from('talents').update({ is_for_sale: true, price: parseInt(sellPrice) }).eq('id', id);
          if (!error) { notify("Listed on Marketplace"); setSellingId(null); setSellPrice(''); } else { notify("Error listing item"); }
      } catch (e) { notify("Error"); }
  };
  const isVelvet = mode === 'velvet';
  const isVideo = (url: string) => url?.match(/\.(mp4|webm|mov|mkv)$/i);

  return (
    <div className="p-6 lg:p-12 pb-32 animate-in fade-in">
        <div className={`flex justify-between items-end border-b pb-8 mb-12 ${isVelvet?'border-white/10':'border-gray-200'}`}>
            <div><h2 className={`text-4xl font-bold uppercase tracking-[0.1em] ${isVelvet?'text-white':'text-gray-900'}`}>{t('common.nav.talent')}</h2><p className={isVelvet ? S.subLuxe : "text-[9px] text-blue-600 mt-2 uppercase tracking-[0.4em] font-bold"}>{isVelvet ? "Database" : "Brand Assets"}</p></div>
            <button onClick={()=>setOpen(!open)} className={`px-8 py-3 rounded-full text-[10px] uppercase font-bold transition-all flex items-center gap-2 border ${isVelvet ? 'border-white/20 text-white hover:bg-[#C6A649] hover:text-black' : 'border-gray-300 text-gray-700 hover:bg-black hover:text-white'}`}>{open?<X size={14}/>:<Plus size={14}/>} {open?t('common.cancel'):"New Persona"}</button>
        </div>
        {open && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 p-12 rounded-[40px] mb-12 transition-all duration-500 ${isVelvet ? S.panel : 'bg-white shadow-xl border border-gray-100'}`}>
                <div onClick={()=>setShowGallery(true)} className={`aspect-[3/4] rounded-[30px] border-2 border-dashed flex items-center justify-center relative overflow-hidden group cursor-pointer transition-all ${isVelvet ? 'bg-black/30 border-white/10 hover:border-[#C6A649]/50' : 'bg-gray-50 border-gray-300 hover:border-blue-500'}`}>
                    {img ? (isVideo(img) ? <video src={img} className="w-full h-full object-cover" autoPlay muted loop/> : <img src={img} className="w-full h-full object-cover"/>) : (<div className={`text-center ${isVelvet?'opacity-30':'opacity-50 text-gray-500'}`}><ImageIcon className="mx-auto mb-4 w-8 h-8"/><span className="text-[10px] font-bold uppercase tracking-widest">Select from Gallery</span></div>)}
                </div>
                <div className="flex flex-col justify-center gap-8">
                    <div className="space-y-4"><label className={`text-[10px] uppercase tracking-widest ${isVelvet?'text-white/40':'text-gray-400'}`}>Name</label><input value={name} onChange={e=>setName(e.target.value)} className={isVelvet ? S.input : "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none transition-all"}/></div>
                    <div className="space-y-4"><label className={`text-[10px] uppercase tracking-widest ${isVelvet?'text-white/40':'text-gray-400'}`}>Notes</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} className={`${isVelvet ? S.input : "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none transition-all"} h-24 resize-none`}/></div>

                    <div className="flex items-center justify-between">
                        <label className={`text-[10px] uppercase tracking-widest ${isVelvet?'text-white/40':'text-gray-400'}`}>Sell on Marketplace?</label>
                        <button onClick={()=>setIsForSale(!isForSale)} className={`w-12 h-6 rounded-full border relative transition-all ${isForSale ? 'bg-[#C6A649] border-[#C6A649]' : 'bg-gray-200 border-gray-300'}`}>
                            <div className={`absolute top-0.5 bottom-0.5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${isForSale ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                        </button>
                    </div>

                    {isForSale && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <label className={`text-[10px] uppercase tracking-widest ${isVelvet?'text-white/40':'text-gray-400'}`}>Price (Credits)</label>
                            <input type="number" value={createPrice} onChange={e=>setCreatePrice(e.target.value)} className={isVelvet ? S.input : "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none transition-all"} placeholder="100"/>
                        </div>
                    )}

                    {!isVelvet && (<div className="space-y-4"><div className="flex gap-4"><button onClick={()=>setRole('model')} className={`flex-1 py-3 border rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase transition-all ${role==='model'?'bg-black text-white border-black':'text-gray-400 border-gray-200'}`}><User size={14}/> Model</button><button onClick={()=>setRole('brand')} className={`flex-1 py-3 border rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase transition-all ${role==='brand'?'bg-blue-600 text-white border-blue-600':'text-gray-400 border-gray-200'}`}><Briefcase size={14}/> Brand</button></div></div>)}
                    <button onClick={save} disabled={!img || !name || (isForSale && !createPrice)} className={`w-full py-5 rounded-2xl text-[10px] font-bold uppercase transition-transform hover:scale-[1.02] active:scale-95 ${isVelvet ? S.btnGold : 'bg-black text-white shadow-xl hover:bg-gray-800'}`}>{t('common.save')}</button>
                </div>
            </div>
        )}
        {showGallery && (
            <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8">
                <div className={`w-full max-w-4xl max-h-[80vh] overflow-y-auto p-8 rounded-[40px] ${isVelvet ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white'}`}>
                    <div className="flex justify-between items-center mb-8"><h3 className={`text-2xl font-bold uppercase tracking-widest ${isVelvet?'text-white':'text-black'}`}>Select Asset</h3><button onClick={()=>setShowGallery(false)}><X size={24} className={isVelvet?'text-white':'text-black'}/></button></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {videos && videos.map((v:any) => (
                            <div key={v.id} onClick={()=>{setImg(v.url); setShowGallery(false);}} className="cursor-pointer group relative aspect-[9/16] rounded-xl overflow-hidden border border-transparent hover:border-[#C6A649]">
                                {isVideo(v.url) ? <video src={v.url} className="w-full h-full object-cover" muted /> : <img src={v.url} className="w-full h-full object-cover" />}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"/>
                            </div>
                        ))}
                         {(!videos || videos.length === 0) && <p className="col-span-4 text-center text-gray-500 py-10">No generations found.</p>}
                    </div>
                </div>
            </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {list.map((inf:Talent) => (
                <div key={inf.id} className={`rounded-[30px] overflow-hidden relative group transition-all duration-500 hover:-translate-y-2 ${isVelvet ? S.panel : 'bg-white shadow-lg border border-gray-100'}`}>
                    {isVideo(inf.image_url) ? <video src={inf.image_url} className="aspect-[3/4] object-cover w-full group-hover:scale-105 transition-transform duration-700" muted loop onMouseOver={e=>e.currentTarget.play()} onMouseOut={e=>e.currentTarget.pause()}/> : <img src={inf.image_url} className="aspect-[3/4] object-cover w-full group-hover:scale-105 transition-transform duration-700"/>}
                    <div className="absolute bottom-0 inset-x-0 p-6 pt-20 flex justify-between items-end bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                        <div><span className="text-[10px] font-bold uppercase tracking-widest text-white block">{inf.name}</span>{(inf as any).for_sale && <span className="text-[8px] font-bold uppercase bg-[#C6A649] text-black px-2 py-0.5 rounded-full mt-1 inline-block ml-2">For Sale</span>}</div>
                        <div className="flex gap-2">
                            {!(inf as any).for_sale && <button onClick={()=>setSellingId(sellingId === inf.id ? null : inf.id)} className="bg-white/10 p-2 rounded-full text-white/50 hover:text-[#C6A649] hover:bg-white/20"><ShoppingBag size={12}/></button>}
                            <button onClick={()=>del(inf.id)} className="bg-white/10 p-2 rounded-full text-white/50 hover:text-red-500 hover:bg-white/20"><X size={12}/></button>
                        </div>
                    </div>
                    {sellingId === inf.id && (
                        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                            <h3 className="text-white text-xs font-bold uppercase mb-4">Sell {inf.name}</h3>
                            <input type="number" placeholder="Price (Credits)" value={sellPrice} onChange={(e)=>setSellPrice(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded p-2 text-white text-xs mb-4 text-center outline-none"/>
                            <div className="flex gap-2 w-full"><button onClick={()=>setSellingId(null)} className="flex-1 py-2 bg-white/10 text-white text-[10px] font-bold uppercase rounded">Cancel</button><button onClick={()=>handleSell(inf.id)} className="flex-1 py-2 bg-[#C6A649] text-black text-[10px] font-bold uppercase rounded">List</button></div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
};

const GalleryPage = ({ videos }: any) => {
  const { mode } = useMode();
  const { showToast } = useToast();
  const [publishing, setPublishing] = useState<string | null>(null);

  const togglePublish = async (video: any) => {
    setPublishing(video.id);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${CONFIG.API_URL}/publish`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
            body: JSON.stringify({ video_id: video.id, type: 'video' })
        });
        if (res.ok) {
            const data = await res.json();
            showToast(data.is_public ? 'Published!' : 'Unpublished', 'success');
            window.location.reload();
        } else { throw new Error("Failed"); }
    } catch (e) { showToast('Error', 'error'); } finally { setPublishing(null); }
  };

  return (
  <div className={`p-6 lg:p-12 pb-32 animate-in fade-in ${mode==='velvet'?'':'bg-gray-50'}`}>
    <h2 className={`text-4xl font-bold uppercase tracking-[0.2em] mb-12 border-b pb-8 ${mode==='velvet'?'text-white border-white/10':'text-gray-900 border-gray-200'}`}>Portfolio</h2>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {videos.map((v:any) => (
            <div key={v.id} className={`rounded-[30px] overflow-hidden group relative hover:-translate-y-2 transition-all ${mode==='velvet'?S.panel:'bg-white shadow-lg border border-gray-100'}`}>
                <video src={v.url} className="aspect-[9/16] object-cover w-full" controls/>
                <div className={`p-5 flex justify-between items-center ${mode==='velvet'?'bg-[#0a0a0a]':'bg-white'}`}>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${mode==='velvet'?'text-white/40':'text-gray-400'}`}>{v.date}</span>
                    <div className="flex gap-2">
                         <button onClick={() => togglePublish(v)} disabled={publishing === v.id} className={`p-2 rounded-full transition-all ${mode==='velvet' ? (v.is_public ? 'bg-[#C6A649] text-black hover:bg-white' : 'bg-white/5 text-gray-400 hover:text-[#C6A649]') : (v.is_public ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500')}`}>
                            {publishing === v.id ? <Loader2 size={14} className="animate-spin"/> : <Globe size={14}/>}
                         </button>
                         <a href={v.url} download className={`p-2 rounded-full transition-all ${mode==='velvet'?'bg-white/5 text-[#C6A649] hover:bg-[#C6A649] hover:text-black':'bg-gray-100 text-black hover:bg-black hover:text-white'}`}><Download size={14}/></a>
                    </div>
                </div>
            </div>
        ))}
    </div>
  </div>
  );
};

const BillingPage = ({ onSelect }: any) => {
  const { mode } = useMode();
  const [annual, setAnnual] = useState(true);
  const isVelvet = mode === 'velvet';

  return (
    <div className="p-6 lg:p-12 pb-32 max-w-7xl mx-auto animate-in fade-in">
      <div className="text-center mb-16">
          <h2 className={`text-4xl lg:text-5xl font-bold uppercase tracking-[0.2em] mb-4 ${isVelvet ? 'text-white' : 'text-gray-900'}`}>Membresía</h2>
          <div className="flex items-center justify-center gap-4 mt-8">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${!annual ? (isVelvet ? 'text-[#C6A649]' : 'text-blue-600') : (isVelvet ? 'text-white/40' : 'text-gray-400')}`}>Mensual</span>
              <button onClick={()=>setAnnual(!annual)} className={`w-12 h-6 rounded-full relative p-1 transition-colors ${isVelvet ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}><div className={`w-4 h-4 rounded-full shadow-lg transition-transform duration-300 ${annual ? 'translate-x-6' : ''} ${isVelvet ? 'bg-[#C6A649]' : 'bg-white'}`}></div></button>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${annual ? (isVelvet ? 'text-[#C6A649]' : 'text-blue-600') : (isVelvet ? 'text-white/40' : 'text-gray-400')}`}>Anual <span className={`${isVelvet ? 'bg-[#C6A649] text-black' : 'bg-blue-600 text-white'} px-2 py-0.5 rounded text-[8px] ml-1`}>-20%</span></span>
          </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {Object.entries(PRICING).map(([k, p]) => {
              const price = annual && (p as any).yearlyPrice ? (p as any).yearlyPrice : p.price;
              return (
                  <div key={k} className={`p-10 rounded-[40px] text-center flex flex-col items-center relative overflow-hidden group hover:scale-105 transition-transform duration-500 ${isVelvet ? S.panel : 'bg-white border border-gray-200 shadow-xl'} ${p.popular ? (isVelvet ? 'border-[#C6A649]/50 shadow-[0_0_50px_rgba(198,166,73,0.15)]' : 'border-blue-500 shadow-lg scale-105') : ''}`}>
                      {p.popular && <div className={`absolute top-0 inset-x-0 h-1.5 ${isVelvet ? 'bg-gradient-to-r from-[#C6A649] to-[#FBF5B7]' : 'bg-blue-500'}`}/>}
                      {p.popular && <div className={`${isVelvet ? 'bg-[#C6A649]/20 text-[#C6A649] border-[#C6A649]/30' : 'bg-blue-50 text-blue-600 border-blue-200'} text-[8px] font-bold px-4 py-1 rounded-full uppercase tracking-widest mb-6 border`}>Recomendado</div>}
                      <h3 className={`text-xl font-bold uppercase tracking-[0.2em] mb-2 ${isVelvet ? 'text-white' : 'text-gray-900'}`}>{p.name}</h3>
                      <div className={`text-5xl font-bold mb-8 tracking-tighter ${isVelvet ? 'text-white' : 'text-gray-900'}`}>${price}<span className={`text-sm font-normal ml-2 ${isVelvet ? 'text-white/30' : 'text-gray-400'}`}>/mo</span></div>
                      <div className={`w-full h-px mb-8 ${isVelvet ? 'bg-white/5' : 'bg-gray-100'}`}></div>
                      <div className="space-y-5 mb-10 w-full text-left">
                          <div className={`p-3 rounded-xl flex items-center justify-center gap-3 border mb-6 ${isVelvet ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}><Zap size={14} className={isVelvet ? 'text-[#C6A649]' : 'text-blue-500'}/><span className={`text-xs font-bold uppercase tracking-widest ${isVelvet ? 'text-white' : 'text-gray-900'}`}>{p.creds} Créditos</span></div>
                          {p.feats.map(f => <div key={f} className={`flex items-center gap-3 text-[10px] uppercase tracking-widest ${isVelvet ? 'text-white/60' : 'text-gray-500'}`}><Check size={10} className={isVelvet ? 'text-[#C6A649]' : 'text-blue-500'}/> {f}</div>)}
                      </div>
                      <button onClick={()=>onSelect(k, annual)} className={`w-full py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] ${p.popular ? (isVelvet ? S.btnGold : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg') : (isVelvet ? 'bg-white/5 text-white hover:bg-white hover:text-black transition-all' : 'bg-gray-100 text-gray-900 hover:bg-black hover:text-white transition-all')}`}>Elegir Plan</button>
                  </div>
              );
          })}
      </div>
    </div>
  );
};

const SettingsPage = ({ profile, setProfile, notify }: any) => {
  const { mode } = useMode();
  const [data, setData] = useState(profile);
  const isVelvet = mode === 'velvet';

  const save = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if(user) {
          const { error } = await supabase.from('profiles').update({ instagram: data.instagram, telegram: data.telegram, phone: data.phone }).eq('id', user.id);
          if(error) { notify("Error al guardar"); } else { notify("Perfil Actualizado"); }
      }
  };
  return (
    <div className="p-6 lg:p-12 max-w-4xl mx-auto">
       <h2 className={`text-4xl font-bold uppercase tracking-[0.2em] mb-12 border-b pb-8 ${isVelvet ? 'text-white border-white/10' : 'text-gray-900 border-gray-200'}`}>Ajustes</h2>
       <div className={`p-10 rounded-[40px] mb-12 flex items-center gap-10 ${isVelvet ? S.panel : 'bg-white shadow-xl border border-gray-200'}`}>
           <div className={`w-24 h-24 rounded-full p-[2px] flex items-center justify-center ${isVelvet ? 'bg-gradient-to-br from-[#C6A649] to-black' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}><span className={`text-3xl font-bold ${isVelvet ? 'text-[#C6A649]' : 'text-white'}`}>JD</span></div>
           <div><h3 className={`text-2xl font-bold ${isVelvet ? 'text-white' : 'text-gray-900'}`}>{data.name}</h3><p className={`text-xs uppercase tracking-widest font-bold mt-1 ${isVelvet ? 'text-[#C6A649]' : 'text-blue-600'}`}>Plan Pro</p></div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
           <div className="space-y-2"><label className={`text-[10px] uppercase tracking-widest ${isVelvet ? 'text-white/40' : 'text-gray-400'}`}>Instagram</label><input value={data.instagram || ''} onChange={e=>setData({...data, instagram:e.target.value})} className={isVelvet ? S.input : "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none transition-all focus:border-blue-500"} placeholder="@usuario"/></div>
           <div className="space-y-2"><label className={`text-[10px] uppercase tracking-widest ${isVelvet ? 'text-white/40' : 'text-gray-400'}`}>Telegram</label><input value={data.telegram || ''} onChange={e=>setData({...data, telegram:e.target.value})} className={isVelvet ? S.input : "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none transition-all focus:border-blue-500"} placeholder="@usuario"/></div>
           <div className="space-y-2"><label className={`text-[10px] uppercase tracking-widest ${isVelvet ? 'text-white/40' : 'text-gray-400'}`}>Teléfono</label><input value={data.phone || ''} onChange={e=>setData({...data, phone:e.target.value})} className={isVelvet ? S.input : "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none transition-all focus:border-blue-500"} placeholder="+123456789"/></div>
       </div>
       <button onClick={save} className={`w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs ${isVelvet ? S.btnGold : 'bg-black text-white hover:bg-gray-800'}`}>Guardar Cambios</button>
    </div>
  );
};

const StudioPage = ({ onGen, credits, notify, onUp, userPlan, talents, profile }: any) => {
  const { mode } = useMode();
  const { t } = useTranslation();
  const [img, setImg] = useState<string|null>(null);
  const [prod, setProd] = useState<string|null>(null);
  const [vid, setVid] = useState<string|null>(null);
  const [type, setType] = useState<'img'|'vid'>('img');
  const [prompt, setPrompt] = useState('');
  const [cam, setCam] = useState('static');
  const [ratio, setRatio] = useState('9:16');
  const [dur, setDur] = useState(5);
  const [velvetFilter, setVelvetFilter] = useState(false);
  const [velvetStyle, setVelvetStyle] = useState('leaked');
  const [loading, setLoading] = useState(false);
  const [resUrl, setResUrl] = useState<string|null>(null);
  const [modal, setModal] = useState(false);

  const init = useRef(false);
  const DEMO_IMG = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop";
  const DEMO_PROD = "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop";

  useEffect(() => {
      if(!init.current) { setImg(DEMO_IMG); setProd(DEMO_PROD); setPrompt("Cinematic slow motion shot, elegant lighting, 8k resolution"); init.current=true; }
      if (mode === 'velvet') { setVelvetFilter(true); } else { setVelvetFilter(false); }
  }, [mode]);

  const handleFile = (e:any, setter:any) => { const f = e.target.files[0]; if(f) { const r=new FileReader(); r.onload=()=>setter(r.result); r.readAsDataURL(f); } };
  const calculateCost = () => { let base = dur === 5 ? 10 : 20; if (mode === 'velvet' || velvetFilter) base += 10; return base; };
  const handlePromptInjection = (text: string) => { setPrompt(prev => prev + (prev ? ", " : "") + text); };

  const generate = async () => {
      if(!img && !vid) return;
      const cost = calculateCost();
      if(!profile?.is_admin && credits < cost) { notify("Faltan Créditos"); onUp(); return; }
      setLoading(true); setResUrl(null);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          const effectiveMode = mode === 'velvet' ? 'velvet' : 'standard';
          const effectiveVelvetStyle = mode === 'velvet' ? velvetStyle : null;
          const r = await fetch(`${CONFIG.API_URL}/generate`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
              body: JSON.stringify({ image: img, endImage: prod, inputVideo: vid, prompt, duration: dur, aspectRatio: ratio, mode: effectiveMode, velvetStyle: effectiveVelvetStyle })
          });
          const d = await r.json();
          if(d.videoUrl) { setResUrl(d.videoUrl); onGen({url: d.videoUrl, cost, id: Date.now().toString(), date: new Date().toLocaleDateString(), prompt, aspectRatio: ratio}); notify("¡Video Generado!"); } else throw new Error(d.error);
      } catch(e:any) { console.error(e); notify("Error de conexión"); } finally { setLoading(false); }
  };

  const panelClass = mode === 'velvet' ? `bg-[#0a0a0a]/90 border-white/5 shadow-2xl hover:border-[#C6A649]/20 text-white` : `bg-white border-gray-200 shadow-xl text-gray-900`;
  const inputClass = mode === 'velvet' ? S.input : "bg-gray-50 border border-gray-200 text-gray-900 p-4 rounded-xl focus:border-blue-500 outline-none transition-all text-xs w-full placeholder:text-gray-400";
  const toggleClass = (isActive: boolean) => {
    if (mode === 'velvet') return isActive ? S.activeTab : 'bg-black/40 text-gray-400 border border-white/10 hover:text-white hover:bg-white/5';
    return isActive ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-500 hover:text-black border border-gray-200 shadow-sm';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 p-6 lg:p-12 pb-32 lg:pb-12 animate-in fade-in duration-700 mb-24 lg:mb-0 relative">
      <StudioOnboarding />
      {modal && <VelvetModal onClose={()=>setModal(false)} onOk={()=>{setModal(false); setVelvetFilter(true); notify("Modo Velvet Activado 🔥");}}/>}
      <div className="lg:col-span-2 space-y-6">
        <div className={`p-8 rounded-[40px] border transition-all duration-300 ${panelClass}`}>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] flex gap-3"><span className={mode==='velvet'?"text-[#C6A649]":"text-blue-600"}>01</span> {t('studio.source')} <Tooltip txt="Base asset"/></h2>
                <div className={`p-1.5 rounded-full border flex ${mode==='velvet'?'bg-black/40 border-white/10':'bg-gray-100 border-gray-200'}`}>
                    <button onClick={()=>{setType('img'); setVid(null);}} className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase transition-all ${toggleClass(type==='img')}`}>Photo</button>
                    <button onClick={()=>{setType('vid'); setImg(null);}} className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase transition-all ${toggleClass(type==='vid')}`}>Remix</button>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div id="studio-source-upload" className={`aspect-[3/4] rounded-[30px] border-2 border-dashed relative overflow-hidden group transition-all duration-300 ${type==='vid'?'border-blue-500/30':(mode==='velvet'?'border-white/10 hover:border-[#C6A649]/50':'border-gray-200 hover:border-blue-500')}`}>
                    {type==='img' ? ( img ? (<><img src={img} className="w-full h-full object-cover"/>{img===DEMO_IMG && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#C6A649] text-black text-[8px] font-bold px-3 py-1 rounded-full uppercase shadow-lg flex gap-2"><Sparkles size={10}/> Demo</div>}<button onClick={()=>{setImg(null);}} className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white hover:bg-red-500 transition-all z-20"><X size={14}/></button></>) : <div className={`absolute inset-0 flex flex-col items-center justify-center ${mode==='velvet'?'text-white/20':'text-gray-400'}`}><Upload className="mb-4 w-8 h-8"/><span className="text-[9px] uppercase font-bold tracking-widest text-center">Subject /<br/>AI Model</span><input type="file" onChange={e=>handleFile(e, setImg)} className="absolute inset-0 opacity-0 cursor-pointer"/></div> ) : ( vid ? (<><video src={vid} autoPlay loop muted className="w-full h-full object-cover opacity-50"/><button onClick={()=>setVid(null)} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-red-500 z-20"><X size={14}/></button></>) : <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-500/40"><Film className="mb-4 w-8 h-8"/><span className="text-[9px] uppercase font-bold tracking-widest text-center">Upload<br/>Video</span><input type="file" onChange={e=>handleFile(e, setVid)} className="absolute inset-0 opacity-0 cursor-pointer"/></div> )}
                </div>
                <div className="flex flex-col gap-4">
                     <div id="studio-product-upload" className={`aspect-[3/4] rounded-[30px] border-2 border-dashed relative overflow-hidden group transition-all duration-300 ${mode==='velvet'?'border-white/10 bg-black/20 hover:border-[#C6A649]/50':'border-gray-200 bg-gray-50 hover:border-blue-500'}`}>
                        {prod ? (<><img src={prod} className="w-full h-full object-cover"/>{prod===DEMO_PROD && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#C6A649] text-black text-[8px] font-bold px-3 py-1 rounded-full uppercase shadow-lg flex gap-2"><Sparkles size={10}/> Demo</div>}<button onClick={()=>setProd(null)} className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white hover:bg-red-500 transition-all z-20"><X size={14}/></button></>) : <div className={`absolute inset-0 flex flex-col items-center justify-center ${mode==='velvet'?'text-white/20':'text-gray-400'}`}><Plus className="mb-4 w-8 h-8"/><span className="text-[9px] uppercase font-bold tracking-widest text-center">Product /<br/>Service</span><input type="file" onChange={e=>handleFile(e, setProd)} className="absolute inset-0 opacity-0 cursor-pointer"/></div>}
                     </div>
                </div>
            </div>
            {talents && talents.length > 0 && (
                <div className={`mt-6 rounded-3xl p-6 border transition-all ${mode==='velvet'?'bg-black/40 border-white/10':'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-4 px-2"><p className="text-[9px] opacity-50 uppercase tracking-widest flex items-center gap-2"><Sparkles size={10}/> Quick Cast</p></div>
                    <div className="overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                        <div className="flex gap-4">
                            {talents.map((t:Talent) => (
                                <button key={t.id} onClick={()=>{ setImg(t.image_url); if (t.notes) handlePromptInjection(t.notes); }} className="group relative flex-shrink-0 w-20 flex flex-col items-center gap-2">
                                    <div className={`w-20 h-20 rounded-full overflow-hidden border-2 transition-all duration-300 p-0.5 ${img === t.image_url ? (mode==='velvet' ? 'border-[#C6A649] shadow-[0_0_20px_rgba(198,166,73,0.3)] scale-105' : 'border-black shadow-lg scale-105') : (mode==='velvet' ? 'border-white/10 opacity-70 group-hover:opacity-100 group-hover:border-white/30' : 'border-gray-200 opacity-80 group-hover:opacity-100 group-hover:border-gray-300')}`}>
                                        <div className="w-full h-full rounded-full overflow-hidden relative"><img src={t.image_url} className="w-full h-full object-cover"/>{img === t.image_url && (<div className="absolute inset-0 bg-black/20 flex items-center justify-center animate-in fade-in zoom-in"><div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${mode==='velvet'?'bg-[#C6A649] text-black':'bg-black text-white'}`}><Check size={12} strokeWidth={4}/></div></div>)}</div>
                                    </div>
                                    <p className={`text-[9px] font-bold uppercase truncate max-w-full text-center tracking-wider ${mode==='velvet' ? (img===t.image_url?'text-[#C6A649]':'text-gray-500') : (img===t.image_url?'text-black':'text-gray-500')}`}>{t.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
        <div className={`p-8 rounded-[40px] border transition-all duration-300 ${panelClass}`}>
            <div className="flex justify-between items-center mb-8"><h2 className="text-xs font-bold uppercase tracking-[0.2em] flex gap-3"><span className={mode==='velvet'?"text-[#C6A649]":"text-blue-600"}>02</span> {t('studio.settings')}</h2>{mode === 'velvet' && (<div className="px-4 py-1.5 rounded-full border border-[#C6A649]/30 bg-[#C6A649]/10 text-[#C6A649] text-[9px] font-bold uppercase tracking-widest flex items-center gap-2"><Flame size={12}/> Velvet Mode Active</div>)}</div>
            <div className="grid grid-cols-4 gap-4 mb-8">
                {CAMS.map(m => (<button key={m.id} onClick={()=>setCam(m.id)} className={`relative p-4 rounded-3xl border flex flex-col items-center gap-3 transition-all group overflow-hidden ${cam===m.id ? (mode==='velvet' ? 'bg-[#C6A649] border-[#C6A649] text-black shadow-lg' : 'bg-black border-black text-white shadow-lg') : (mode==='velvet' ? 'bg-black/40 border-white/5 text-gray-500 hover:bg-white/5' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-white hover:border-gray-300')}`}>{m.icon}<span className="text-[7px] font-bold uppercase tracking-widest">{m.label}</span></button>))}
            </div>
            {mode === 'velvet' && (
                <div className="grid grid-cols-4 gap-3 mb-6 animate-in fade-in slide-in-from-top-4">
                    {VELVET_STYLES.map(v => (<button key={v.name} onClick={()=>{setVelvetStyle(v.id); handlePromptInjection(v.desc);}} className={`p-3 rounded-2xl border transition-all text-center group ${velvetStyle===v.id ? (mode==='velvet' ? 'bg-pink-500/10 border-pink-500 text-white' : 'bg-purple-100 border-purple-500 text-purple-900') : (mode==='velvet' ? 'bg-black/40 border-white/5 text-white/50' : 'bg-white border-gray-200 text-gray-400')}`}><p className="text-[8px] font-bold uppercase tracking-widest mb-1">{v.name}</p></button>))}
                </div>
            )}
            <div className="relative group"><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe your vision..." className={`${inputClass} h-32 mb-8 resize-none p-6 text-sm ${mode==='velvet' ? 'border-pink-900/50 focus:border-pink-500' : ''}`}/><div className="absolute bottom-10 right-4"><Sparkles size={16} className={`${mode==='velvet'?'text-[#C6A649]':'text-blue-500'} opacity-50`}/></div></div>
            <div className={`grid grid-cols-2 gap-8 pt-6 border-t ${mode==='velvet'?'border-white/5':'border-gray-100'}`}>
                <div className="space-y-4">
                    <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest opacity-40">Duration</span><span className={`font-bold text-xs ${mode==='velvet'?'text-[#C6A649]':'text-blue-600'}`}>{dur}s</span></div>
                    <div className={`flex gap-2 p-1.5 rounded-2xl border ${mode==='velvet'?'bg-black/40 border-white/10':'bg-gray-100 border-gray-200'}`}><button onClick={()=>setDur(5)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${toggleClass(dur===5)}`}>5s (10cr)</button><button onClick={()=>setDur(10)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${toggleClass(dur===10)}`}>10s (20cr)</button></div>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest opacity-40">Ratio</span></div>
                    <div className={`flex gap-2 p-1.5 rounded-2xl border ${mode==='velvet'?'bg-black/40 border-white/10':'bg-gray-100 border-gray-200'}`}>{RATIOS.map(r => (<button key={r.id} onClick={() => setRatio(r.id)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${toggleClass(ratio === r.id)}`}>{r.id}</button>))}</div>
                </div>
            </div>
        </div>
        <button id="studio-generate-btn" onClick={generate} disabled={loading || (!img && !vid)} className={`w-full py-7 rounded-[32px] font-bold uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 fixed bottom-6 left-4 right-4 lg:static lg:w-full z-50 shadow-2xl transition-all duration-300 ${mode==='velvet' ? (velvetFilter ? S.btnVelvet : S.btnGold) : 'bg-black text-white shadow-lg hover:bg-gray-800 hover:shadow-xl active:scale-95'}`}>{loading ? "Processing..." : <><Zap size={18}/> {t('studio.generate')} ({calculateCost()})</>}</button>
      </div>
      <div className="lg:col-span-3 relative z-10 flex flex-col pt-0 h-[calc(100vh-100px)] sticky top-8">
         <div className={`w-full h-full rounded-[40px] border overflow-hidden shadow-2xl relative transition-all duration-500 flex flex-col ${mode==='velvet' ? 'bg-black border-white/10' : 'bg-white border-gray-200'}`}>
            <div className={`flex-1 flex items-center justify-center p-8 transition-colors ${mode==='velvet' ? 'bg-black/50' : 'bg-gray-50'}`}>
                 <div className={`relative w-full max-h-full transition-all duration-500 shadow-2xl ${ratio==='16:9'?'aspect-video w-full':ratio==='1:1'?'aspect-square h-full':'aspect-[9/16] h-full'} ${mode==='velvet' ? 'bg-black' : 'bg-black'}`}>
                    <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20 pointer-events-none opacity-60"><div className="text-[10px] text-white font-mono flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> REC</div><div className="text-[10px] text-white font-mono">{dur}s • 4K</div></div>
                    {!resUrl && !loading && (<div className="absolute inset-0 flex flex-col items-center justify-center text-white/10 gap-6 border border-white/5"><div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center"><Video size={40} strokeWidth={1}/></div><span className="text-[9px] uppercase tracking-[0.4em] font-light">Preview</span></div>)}
                    {loading && (<div className="absolute inset-0 bg-[#050505] z-30 flex flex-col items-center justify-center"><div className={`w-20 h-20 border-t-2 border-r-2 rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(198,166,73,0.2)] ${mode==='velvet' ? 'border-[#C6A649]' : 'border-black shadow-lg'}`}></div><p className={`text-[10px] uppercase tracking-widest animate-pulse font-bold ${mode==='velvet'?'text-[#C6A649]':'text-black'}`}>{t('studio.processing')}</p></div>)}
                    {resUrl && <video src={resUrl} controls autoPlay loop className="w-full h-full object-cover"/>}
                 </div>
            </div>
            <div className={`p-6 border-t flex justify-center backdrop-blur-sm transition-colors ${mode==='velvet'?'border-white/5 bg-black/40':'border-gray-100 bg-white/40'}`}>
                {resUrl ? (<a href={resUrl} download className={`px-12 py-4 rounded-full text-[10px] font-bold uppercase hover:scale-105 transition-transform flex gap-3 shadow-2xl items-center ${mode==='velvet' ? 'bg-white text-black' : 'bg-black text-white'}`}><Download size={16}/> Download 4K</a>) : (<div className={`text-[9px] uppercase tracking-widest ${mode==='velvet'?'text-white/30':'text-gray-400'}`}>Ready to Render</div>)}
            </div>
         </div>
      </div>
    </div>
  );
};

// --- APP LAYOUT ---

function ProtectedLayout({ session, credits, handleLogout, setSelPlan, profile, mode, selPlan, notify }: any) {
    if (!session) return <Navigate to="/login" replace />;
    return (
        <div className={`${mode === 'velvet' ? S.bg : 'bg-gray-50 min-h-screen text-gray-900 font-sans'}`}>
            {selPlan && <CheckoutModal planKey={selPlan.key} annual={selPlan.annual} onClose={()=>setSelPlan(null)}/>}
            <Sidebar credits={credits} onLogout={handleLogout} onUp={()=>setSelPlan({key:'creator', annual:true})} userProfile={profile} onUpgrade={()=>setSelPlan({key:'creator', annual:true})} notify={notify} />
            <MobileHeader credits={credits} userProfile={profile} onUpgrade={()=>setSelPlan({key:'creator', annual:true})} />
            <main className="lg:ml-80 min-h-screen pt-20 lg:pt-0 transition-colors duration-500"><Outlet /></main>
            <MobileNav />
        </div>
    );
}

function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [influencers, setInfluencers] = useState<Talent[]>([]);
  const [credits, setCredits] = useState(0);
  const [userPlan, setUserPlan] = useState<'starter' | 'creator' | 'agency'>('starter');
  const [selPlan, setSelPlan] = useState<{key: string, annual: boolean} | null>(null);
  const [profile, setProfile] = useState<UserProfile>({ name: "Agencia", email: "", plan: 'starter' });
  const { mode, setMode } = useMode();
  const { showToast } = useToast();
  const notify = (msg: string) => showToast(msg);

  const handleInf = {
      add: async (inf: any) => {
          const user = session?.user;
          if(!user) return;
          const tempId = `temp_${Date.now()}`;
          const newTalent = { ...inf, id: tempId, user_id: user.id };
          setInfluencers([newTalent, ...influencers]);

          const payload = {
            name: inf.name,
            image_url: inf.image_url,
            role: inf.role || 'model',
            dna_prompt: inf.dna_prompt || '',
            user_id: user.id,
            // User requested 'is_for_sale' but DB column is 'for_sale' per schema. Keeping 'for_sale' to avoid SQL error.
            for_sale: inf.for_sale || false,
            price: inf.price || 0,
            is_public: inf.for_sale || false
          };

          const { data, error } = await supabase.from('talents').insert(payload).select().single();
          if(error) { console.error("Error adding talent:", error); notify("Error adding talent"); setInfluencers(prev => prev.filter(i => i.id !== tempId)); }
          else if (data) { setInfluencers(prev => prev.map(i => i.id === tempId ? data : i)); }
      },
      del: async (id: string) => {
          const old = [...influencers];
          setInfluencers(prev => prev.filter(i => i.id !== id));
          const { error } = await supabase.from('talents').delete().eq('id', id);
          if(error) { console.error("Error deleting talent:", error); notify("Error deleting"); setInfluencers(old); }
      }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}}) => { setSession(session); if(session) initData(session.user.id); else setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => { setSession(session); if(session) initData(session.user.id); else setLoading(false); });
    return () => { subscription.unsubscribe(); };
  }, []);

  const initData = async (uid:string) => {
      try {
        const { data: p, error: pError } = await supabase.from('profiles').select('*').eq('id', uid).single();
        if(p && !pError) {
             setCredits(p.credits);
             setUserPlan(p.plan);
             setProfile({...p, email: session?.user?.email || "", plan: p.plan || 'starter'});

             if (p.plan === 'starter' && !p.is_admin) {
                 setMode('agency');
             }
        }
        else { setCredits(50); setUserPlan('starter'); setProfile({name: "User", email: session?.user?.email || "", plan: 'starter'}); }
        const { data: v, error: vError } = await supabase.from('generations').select('*').eq('user_id', uid).order('created_at', {ascending:false});
        if(v && !vError) setVideos(v.map((i:any)=>({id:i.id, url:i.video_url, date:new Date(i.created_at).toLocaleDateString(), aspectRatio:i.aspect_ratio, cost:i.cost, prompt: i.prompt, is_public: i.is_public})));
        const { data: t, error: tError } = await supabase.from('talents').select('*').eq('user_id', uid).order('created_at', {ascending:false});
        if(t && !tError) setInfluencers(t);
      } catch (err) { console.error("Error loading data", err); } finally { setLoading(false); }
  };
  const handleVideoSaved = async (videoData: any) => { setVideos(prev => [videoData, ...prev]); if (!profile.is_admin) setCredits(prev => prev - videoData.cost); };
  const handleUpdateProfile = (p: UserProfile) => { setProfile(p); };
  const handleLogout = async () => { await supabase.auth.signOut(); };

  if(loading) return <div className="min-h-screen bg-[#030303] flex items-center justify-center"><Loader2 className="w-12 h-12 text-[#C6A649] animate-spin"/></div>;

  return (
    <Router>
        <Routes>
            <Route path="/" element={!session ? <LandingPage /> : <Navigate to="/app" replace />} />
            <Route path="/login" element={!session ? <LoginScreen onLogin={() => {}} /> : <Navigate to="/app" replace />} />
            <Route path="/app" element={<ProtectedLayout session={session} credits={credits} handleLogout={handleLogout} setSelPlan={setSelPlan} profile={profile} mode={mode} selPlan={selPlan} notify={notify} />}>
                <Route index element={<StudioPage onGen={handleVideoSaved} influencers={influencers} credits={credits} notify={notify} onUp={()=>setSelPlan({key:'creator', annual:true})} userPlan={userPlan} talents={influencers} profile={profile}/>}/>
                <Route path="explore" element={<ExplorePage />} />
                <Route path="talent" element={<TalentPage list={influencers} add={handleInf.add} del={handleInf.del} notify={notify} videos={videos}/>}/>
                <Route path="gallery" element={<GalleryPage videos={videos}/>}/>
                <Route path="billing" element={<BillingPage onSelect={(k:string, a:boolean)=>setSelPlan({key:k, annual:a})}/>}/>
                <Route path="settings" element={<SettingsPage credits={credits} profile={profile} setProfile={handleUpdateProfile} notify={notify}/>}/>
                <Route path="*" element={<Navigate to="/app" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </Router>
  );
}

function App() {
  return (
    <ModeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ModeProvider>
  );
}

export default App;
