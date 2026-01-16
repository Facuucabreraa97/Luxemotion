import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Loader2, Play, Sparkles, ChevronDown, ChevronRight, Mail, Lock, Upload, X, Plus, User,
  Briefcase, Camera, ShoppingBag, Globe, Download, Zap, Check, Video, Users,
  Image as ImageIcon, CreditCard, Settings, LogOut, Crown, Film, Move, ZoomIn,
  Heart, Smartphone, Monitor, Square, Flame, LayoutDashboard, Info, Mic, Activity
} from 'lucide-react';
import { createClient, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';
import './i18n';
import Admin from './pages/Admin';

// --- CONFIGURATION ---
const getApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  url = url.replace(/\/$/, "");
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

const CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder',
  API_URL: getApiUrl(),
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
  titleLuxe: "text-2xl md:text-3xl font-bold tracking-[0.2em] text-white uppercase",
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
  role?: string;
}

export interface Talent {
  id: string;
  name: string;
  image_url: string;
  notes?: string;
  role?: string;
  dna_prompt?: string;
  user_id?: string;
  original_creator_id?: string;
  sales_count?: number;
  for_sale?: boolean;
  price?: number;
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
  creds: number;
  price: number;
  yearlyPrice?: number;
  popular?: boolean;
}

const PRICING_META: Record<string, PricingTier> = {
  starter: { creds: 50, price: 0 },
  creator: { creds: 1000, price: 29, yearlyPrice: 24, popular: true },
  agency: { creds: 5000, price: 99, yearlyPrice: 79 }
};

const CAMS = [
  { id: 'static', icon: <Move size={18}/> },
  { id: 'zoom', icon: <ZoomIn size={18}/> },
  { id: 'eye', icon: <Heart size={18}/> },
  { id: 'hand', icon: <Video size={18}/> }
];

const RATIOS = [
  { id: '9:16', labelKey: 'ratios.stories', icon: <Smartphone size={14}/> },
  { id: '16:9', labelKey: 'ratios.cinema', icon: <Monitor size={14}/> },
  { id: '1:1', labelKey: 'ratios.square', icon: <Square size={14}/> }
];

const VELVET_STYLES = [
  { id: 'leaked' },
  { id: 'boudoir' },
  { id: 'cosplay' },
];

const VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', desc: 'Soft American' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', desc: 'Strong/Narrative' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', desc: 'Male' }
];

const ONBOARDING_STEPS = [
    { target: 'studio-source-upload', textKey: "modals.onboarding.step1", pos: 'right' },
    { target: 'studio-product-upload', textKey: "modals.onboarding.step2", pos: 'left' },
    { id: 'mode-switch', textKey: "modals.onboarding.step3", pos: 'bottom' },
    { target: 'studio-generate-btn', textKey: "modals.onboarding.step4", pos: 'top' }
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

const VelvetModal = ({ onClose, onOk }: { onClose: () => void, onOk: () => void }) => {
  const { t } = useTranslation();
  return (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-in zoom-in duration-300">
    <div className={`w-full max-w-sm p-1 rounded-[40px] relative group overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-900 opacity-50 blur-xl"></div>
      <div className="bg-[#050505] relative rounded-[38px] p-8 text-center border border-pink-500/30 h-full">
        <button onClick={onClose} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"><X size={20}/></button>
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-tr from-pink-600 to-purple-900 rounded-full flex items-center justify-center border border-pink-500/50 shadow-lg">
             <Flame size={32} className="text-white fill-white"/>
        </div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400 uppercase tracking-[0.2em] mb-4">{t('modals.velvet.title')}</h2>
        <div className="inline-block px-4 py-1 border border-pink-500/30 rounded-full bg-pink-500/10 mb-6"><span className="text-[9px] font-bold text-pink-400 uppercase tracking-[0.3em]">{t('modals.velvet.adults_only')}</span></div>
        <p className="text-white/50 text-xs mb-8 leading-relaxed">{t('modals.velvet.desc')}</p>
        <button onClick={onOk} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 group ${S.btnVelvet}`}><span>{t('modals.velvet.unlock')}</span> <ChevronRight size={16}/></button>
      </div>
    </div>
  </div>
)};

const VelvetBenefitsModal: React.FC<{ onClose: () => void; onUnlock: () => void }> = ({ onClose, onUnlock }) => {
  const { t } = useTranslation();
  const benefits = t('modals.velvet_benefits.benefits', { returnObjects: true }) as Record<string, string>;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-in zoom-in duration-300">
      <div className="w-full max-w-sm relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-900 opacity-40 blur-2xl rounded-[40px]"></div>
        <div className="bg-[#050505] relative rounded-[32px] p-8 text-center border border-pink-500/20 shadow-2xl overflow-hidden">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors z-10"><X size={20} /></button>
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-tr from-pink-600 to-purple-900 rounded-full flex items-center justify-center border border-pink-500/50 shadow-[0_0_30px_rgba(236,72,153,0.3)] animate-pulse relative z-10">
            <Lock size={32} className="text-white fill-white/20" />
          </div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400 uppercase tracking-[0.2em] mb-8 relative z-10 drop-shadow-sm">{t('modals.velvet_benefits.title')}</h2>
          <div className="space-y-4 mb-8 text-left pl-6 relative z-10">
            {Object.values(benefits).map((benefit, index) => (
              <div key={index} className="flex items-center gap-4 group/item">
                <div className="p-1 rounded-full bg-gradient-to-br from-[#C6A649] to-[#FCD34D] text-black shadow-[0_0_10px_rgba(198,166,73,0.3)]"><Check size={12} strokeWidth={4} /></div>
                <span className="text-sm font-medium text-gray-300 tracking-wide group-hover/item:text-white transition-colors">{benefit}</span>
              </div>
            ))}
          </div>
          <button onClick={onUnlock} className={`w-full py-4 text-sm ${S.btnVelvet} relative z-10 shadow-[0_0_20px_rgba(236,72,153,0.5)]`}>{t('modals.velvet_benefits.unlock_access')}</button>
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
    const { t } = useTranslation();

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
                    <p className="text-sm font-medium leading-relaxed mb-6">{t(currentStep.textKey as any)}</p>
                    <div className="flex justify-end">
                        <button onClick={handleNext} className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-transform hover:scale-105 ${mode === 'velvet' ? 'bg-[#C6A649] text-black' : 'bg-black text-white'}`}>
                            {step === ONBOARDING_STEPS.length - 1 ? t('modals.onboarding.finish') : t('modals.onboarding.next')}
                            {step === ONBOARDING_STEPS.length - 1 ? <Check size={12}/> : <ChevronRight size={12}/>}
                        </button>
                    </div>
                </div>
            </div>
        </div>, document.body
    );
};

interface CheckoutModalProps { planKey: string; annual: boolean; onClose: () => void; }
const CheckoutModal = ({ planKey, annual: initialAnnual, onClose }: CheckoutModalProps) => {
  const { mode } = useMode();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [isAnnual, setIsAnnual] = useState(initialAnnual);
  const planMeta = PRICING_META[planKey];
  const price = isAnnual && planMeta.yearlyPrice ? planMeta.yearlyPrice : planMeta.price;
  const [load, setLoad] = useState(false);
  const [currency, setCurrency] = useState<'USDT' | 'ARS'>('ARS');
  const isVelvet = mode === 'velvet';

  const planName = t(`pricing.${planKey}.name`);
  const features = t(`pricing.${planKey}.features`, { returnObjects: true }) as string[];

  const handleCheckout = async () => {
      if (currency === 'USDT') {
          showToast(t('billing.crypto_disabled'), 'info');
          return;
      }
      setLoad(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if(!session) return;

        const payloadPrice = currency === 'ARS' ? price * 1500 : price;
        const payloadCurrency = currency;

        const res = await fetch(`${CONFIG.API_URL}/create-preference`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify({
                title: `MivideoAI ${planName}`,
                price: payloadPrice,
                quantity: 1,
                type: planKey,
                currency: payloadCurrency
            })
        });

        if (!res.ok) throw new Error("Error");

        const data = await res.json();
        if(data.id) {
            // @ts-ignore
            if (window.MercadoPago) {
                // @ts-ignore
                const mp = new window.MercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, { locale: 'es-AR' });
                mp.checkout({ preference: { id: data.id }, autoOpen: true });
            } else {
                window.location.href = data.url;
            }
        }
      } catch(e) {
          console.error(e);
          showToast(t('explore.buy.error'), 'error');
      } finally { setLoad(false); }
  };

  const displayPrice = currency === 'ARS' ? (price * 1500).toLocaleString('es-AR') : price;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className={`w-full max-w-md rounded-[40px] relative overflow-hidden transition-all duration-300 ${mode==='velvet'?'bg-[#0a0a0a] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]':'bg-white shadow-2xl'}`}>
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#C6A649]/20 to-transparent opacity-50 pointer-events-none"></div>
          <button onClick={onClose} className={`absolute top-4 right-4 cursor-pointer z-50 ${mode === 'velvet' ? 'text-white' : 'text-gray-800'}`}><X size={20}/></button>

          <div className="p-8 md:p-10 text-center relative z-10">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#C6A649] to-[#FBF5B7] shadow-lg shadow-[#C6A649]/20">
                  <Crown size={32} className="text-black fill-black/20"/>
              </div>

              <h2 className={`text-3xl font-bold uppercase tracking-widest mb-2 ${mode==='velvet'?'text-white':'text-black'}`}>{planName}</h2>
              <div className="flex items-center justify-center gap-2 mb-8">
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${mode==='velvet'?'text-white/40':'text-gray-600'}`}>Premium Access</span>
              </div>

              <div className="flex justify-center gap-2 mb-8 p-1 rounded-full bg-black/20 inline-flex backdrop-blur-sm border border-white/5">
                  <button onClick={() => setCurrency('USDT')} className={`px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${currency === 'USDT' ? 'bg-[#C6A649] text-black shadow-lg' : 'text-white/50 hover:text-white'}`}>{t('common.currency.usdt')}</button>
                  <button onClick={() => setCurrency('ARS')} className={`px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${currency === 'ARS' ? 'bg-[#C6A649] text-black shadow-lg' : 'text-white/50 hover:text-white'}`}>{t('common.currency.ars')}</button>
              </div>

              <div className="flex items-center justify-center gap-4 mb-8">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${!isAnnual ? 'text-[#C6A649]' : 'text-white/30'}`}>{t('billing.monthly')}</span>
                  <button onClick={()=>setIsAnnual(!isAnnual)} className={`w-12 h-6 rounded-full relative p-1 transition-colors bg-white/10 hover:bg-white/20`}><div className={`w-4 h-4 rounded-full shadow-lg transition-transform duration-300 ${isAnnual ? 'translate-x-6' : ''} bg-[#C6A649]`}></div></button>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isAnnual ? 'text-[#C6A649]' : 'text-white/30'}`}>{t('billing.annual')} <span className="bg-[#C6A649] text-black px-1.5 py-0.5 rounded text-[8px] ml-1">{t('billing.discount')}</span></span>
              </div>

              <div className={`text-6xl font-serif font-bold mb-8 flex items-start justify-center gap-1 ${mode==='velvet'?'text-white':'text-black'}`}>
                <span className="text-2xl mt-2 opacity-50">$</span>
                {displayPrice}
                <span className="text-sm font-sans font-normal self-end mb-2 opacity-40">/mo</span>
              </div>

              <div className={`rounded-2xl p-6 mb-8 text-left border ${mode==='velvet'?'bg-white/5 border-white/5':'bg-gray-50 border-gray-100'}`}>
                <ul className="space-y-3">
                    {features.map(f=><li key={f} className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider ${mode==='velvet'?'text-gray-300':'text-black'}`}><div className="w-4 h-4 rounded-full bg-[#C6A649]/20 flex items-center justify-center"><Check size={8} className="text-[#C6A649]"/></div> {f}</li>)}
                </ul>
              </div>

              <button onClick={handleCheckout} disabled={load} className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 relative overflow-hidden group ${S.btnGold} disabled:opacity-50`}>
                  {load && <Loader2 size={16} className="animate-spin"/>}
                  <span>{load ? t('studio.processing') : (currency === 'ARS' ? t('billing.pay_mp') : t('billing.pay_crypto'))}</span>
                  {!load && <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>}
              </button>

              <div className="mt-6 text-center">
                 <p className="text-[9px] text-white/30 uppercase tracking-widest">{t('billing.terms_text')}</p>
              </div>
          </div>
      </div>
    </div>
  );
};

const MobileHeader = ({ credits, userProfile, onUpgrade }: any) => {
  const { mode, setMode } = useMode();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showVelvetBenefits, setShowVelvetBenefits] = useState(false);
  const { t } = useTranslation();

  const handleModeToggle = () => {
    if (mode === 'velvet') { setMode('agency'); } else {
      const canAccess = userProfile?.is_admin || userProfile?.plan === 'creator' || userProfile?.plan === 'agency';
      if (canAccess) { setMode('velvet'); } else { setShowVelvetBenefits(true); }
    }
  };

  return (
    <>
      {showVelvetBenefits && <VelvetBenefitsModal onClose={() => setShowVelvetBenefits(false)} onUnlock={() => { setShowVelvetBenefits(false); setShowUpgradeModal(true); }} />}
      {showUpgradeModal && <CheckoutModal planKey="creator" annual={true} onClose={() => setShowUpgradeModal(false)} />}
      <div className={`lg:hidden fixed top-0 w-full p-4 border-b z-50 flex justify-between items-center transition-colors ${mode === 'velvet' ? 'bg-[#0a0a0a]/90 backdrop-blur-md border-white/5' : 'bg-white/90 backdrop-blur-md border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mode === 'velvet' ? 'bg-[#C6A649] text-black' : 'bg-blue-600 text-white'}`}><Play fill={mode === 'velvet' ? "black" : "white"} size={14}/></div>
            <span className={`text-sm font-bold tracking-[0.2em] ${mode === 'velvet' ? 'text-white' : 'text-gray-900'}`}>MivideoAI</span>
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

const MobileNav = () => {
    const { t } = useTranslation();
    return (
  <div className="lg:hidden fixed bottom-0 w-full bg-[#0a0a0a] border-t border-white/10 flex justify-around p-2 pb-6 z-50">
      <NavLink to="/app" end className={({isActive})=>`p-3 flex flex-col items-center gap-1 ${isActive?'text-[#C6A649]':'text-white/50'}`}><LayoutDashboard size={20}/><span className="text-[8px] uppercase font-bold">{t('common.nav.studio')}</span></NavLink>
      <NavLink to="/app/explore" className={({isActive})=>`p-3 flex flex-col items-center gap-1 ${isActive?'text-[#C6A649]':'text-white/50'}`}><Globe size={20}/><span className="text-[8px] uppercase font-bold">{t('common.nav.explore')}</span></NavLink>
      <NavLink to="/app/talent" className={({isActive})=>`p-3 flex flex-col items-center gap-1 ${isActive?'text-[#C6A649]':'text-white/50'}`}><Users size={20}/><span className="text-[8px] uppercase font-bold">{t('common.nav.talent')}</span></NavLink>
      <NavLink to="/app/gallery" className={({isActive})=>`p-3 flex flex-col items-center gap-1 ${isActive?'text-[#C6A649]':'text-white/50'}`}><ImageIcon size={20}/><span className="text-[8px] uppercase font-bold">{t('common.nav.gallery')}</span></NavLink>
      <NavLink to="/app/billing" className={({isActive})=>`p-3 flex flex-col items-center gap-1 ${isActive?'text-[#C6A649]':'text-white/50'}`}><CreditCard size={20}/><span className="text-[8px] uppercase font-bold">{t('common.nav.billing')}</span></NavLink>
      <NavLink to="/app/settings" className={({isActive})=>`p-3 flex flex-col items-center gap-1 ${isActive?'text-[#C6A649]':'text-white/50'}`}><Settings size={20}/><span className="text-[8px] uppercase font-bold">{t('common.nav.settings')}</span></NavLink>
  </div>
)};

const Sidebar = ({ credits, onLogout, onUp, userProfile, onUpgrade, notify }: any) => {
  const { pathname } = useLocation();
  const { mode, toggleMode, setMode } = useMode();
  const { t, i18n } = useTranslation();
  const [showVelvetBenefits, setShowVelvetBenefits] = React.useState(false);

  const links = [
    { icon: Video, label: t('common.nav.studio'), path: '/app' },
    { icon: Globe, label: t('common.nav.explore'), path: '/app/explore' },
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
          setShowVelvetBenefits(true);
          return;
      }
      setMode('velvet');
      notify(t('studio.velvet_active'));
    }
  };

  return (
    <>
      {showVelvetBenefits && <VelvetBenefitsModal onClose={() => setShowVelvetBenefits(false)} onUnlock={() => { setShowVelvetBenefits(false); onUpgrade(); }} />}
      <aside className={`fixed left-0 top-0 h-screen w-80 flex flex-col hidden lg:flex border-r transition-all duration-500 z-50 ${mode === 'velvet' ? 'bg-black/95 border-white/5 backdrop-blur-xl' : 'bg-[#F8F9FA] border-gray-200'}`}>
        <div className="p-8 pb-4">
          {mode === 'velvet' ? <h1 className="text-2xl font-bold tracking-[0.2em] uppercase mb-1 text-white">Mivideo<span className="text-[#C6A649]">AI</span></h1> : <h1 className="text-2xl font-bold tracking-[0.2em] uppercase mb-1 text-black">MivideoAI</h1>}
          <div className="flex items-center justify-between"><p className="text-[9px] text-gray-500 uppercase tracking-[0.4em] font-bold">AI Video Generator</p><button onClick={handleLang} className={`text-[9px] font-bold uppercase px-2 py-1 rounded border transition-colors ${mode==='velvet'?'border-white/10 text-gray-400 hover:text-white':'border-gray-300 text-gray-500 hover:text-black hover:border-gray-400'}`}>{i18n.language.toUpperCase()}</button></div>
        </div>
        <div className="px-8 mb-6">
          <button id="sidebar-mode-toggle" onClick={handleModeToggle} className={`w-full p-1 rounded-full border flex items-center relative overflow-hidden group transition-all duration-500 ${mode==='velvet' ? 'bg-black border-white/10' : 'bg-gray-200 border-gray-300'}`}>
              <div className={`w-1/2 text-[9px] font-bold uppercase text-center py-2 rounded-full relative z-10 transition-colors ${mode==='velvet'?'text-white':'text-gray-500'}`}>{t('common.mode.velvet')}</div>
              <div className={`w-1/2 text-[9px] font-bold uppercase text-center py-2 rounded-full relative z-10 transition-colors ${mode==='agency'?'text-black':'text-gray-500'}`}>{t('common.mode.agency')}</div>
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
              <p className={`text-[9px] uppercase font-bold tracking-widest mb-2 ${mode==='velvet'?'text-gray-400':'text-gray-500'}`}>{t('sidebar.credits_avail')}</p>
              <div className={`text-4xl font-bold mb-4 flex items-baseline gap-1 ${mode==='velvet'?'text-white':'text-black'}`}>{userProfile?.is_admin ? '∞' : credits}<span className="text-sm font-normal text-gray-500">cr</span></div>
              <button onClick={onUp} className={`w-full py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg ${mode==='velvet' ? 'bg-[#C6A649] text-black hover:bg-[#d4b55b]' : 'bg-black text-white hover:bg-gray-800'}`}>
                  <Crown size={14}/> {t('sidebar.reload')}
              </button>
          </div>
        </div>
        <div className="px-8 pb-8"><button onClick={onLogout} className="flex items-center gap-3 text-[10px] font-bold uppercase text-red-500/50 hover:text-red-500 transition-colors tracking-widest pl-2"><LogOut size={14}/> {t('sidebar.logout')}</button></div>
      </aside>
    </>
  );
};

// --- PAGES ---

const ExplorePage = () => {
    const { mode } = useMode();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const { showToast } = useToast();
    const [tab, setTab] = useState<'community' | 'marketplace'>(searchParams.get('tab') === 'marketplace' ? 'marketplace' : 'community');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [purchasing, setPurchasing] = useState<string | null>(null);

    const isVideo = (url: string) => url?.match(/\.(mp4|webm|mov|mkv)$/i);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setItems([]);
        setError(null);

        const fetchData = async () => {
            try {
                if (tab === 'community') {
                    // Correct query: select public generations (community) without user filter
                    let { data, error } = await supabase
                        .from('generations')
                        .select('*')
                        .eq('is_public', true)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    if (active) setItems(data || []);
                } else {
                    // Correct query: select talents for sale (marketplace)
                    let { data, error } = await supabase
                        .from('talents')
                        .select('*')
                        .eq('for_sale', true)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    if (active) setItems(data || []);
                }
            } catch (err) {
                console.error("ExplorePage Error:", err);
                if (active) {
                    setError(tab === 'community' ? t('explore.empty.community') : t('explore.empty.marketplace'));
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchData();
        return () => { active = false; };
    }, [tab, t]); // Added t to dependency array

    const handleBuy = async (item: any) => {
        if (!item.for_sale || !item.price) return;
        setPurchasing(item.id);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            console.log("Payload sent:", { userId: session.user.id, assetId: item.id });

            const res = await fetch(`${CONFIG.API_URL}/buy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    userId: session.user.id,
                    assetId: item.id,
                talent_id: item.id,
                cost: item.price
                })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Error');

            showToast(t('explore.buy.success'), 'success');
            // Optimistically update UI
            setItems(prev => prev.filter(i => i.id !== item.id));
        } catch (error: any) {
            console.error("Purchase error:", error);
            showToast(t('explore.buy.error'), 'error');
        } finally {
            setPurchasing(null);
        }
    };

    const [purchaseItem, setPurchaseItem] = useState<any>(null);

    const handleBuyClick = (item: any) => {
        setPurchaseItem(item);
    };

    const confirmPurchase = async () => {
        if (!purchaseItem) return;
        await handleBuy(purchaseItem);
        setPurchaseItem(null);
    };

    const placeholders = Array(9).fill(0);

    return (
        <div className={`pt-24 px-4 md:px-6 animate-in fade-in pb-32 min-h-screen ${mode === 'velvet' ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6 md:mb-12">
                <h2 className={`text-3xl md:text-4xl font-bold uppercase tracking-[0.2em] ${mode==='velvet'?'text-white':'text-gray-900'}`}>{t('explore.title')}</h2>
                <div className={`p-1 rounded-full border flex ${mode==='velvet'?'bg-black/40 border-white/10':'bg-gray-100 border-gray-200'}`}>
                    <button onClick={()=>setTab('community')} className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase transition-all ${tab==='community' ? (mode==='velvet'?'bg-[#C6A649] text-black shadow-lg':'bg-black text-white shadow-lg') : 'text-gray-400 hover:text-white'}`}>{t('explore.tabs.community')}</button>
                    <button onClick={()=>setTab('marketplace')} className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase transition-all ${tab==='marketplace' ? (mode==='velvet'?'bg-[#C6A649] text-black shadow-lg':'bg-black text-white shadow-lg') : 'text-gray-400 hover:text-white'}`}>{t('explore.tabs.marketplace')}</button>
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
                            <p className="uppercase tracking-widest text-xs font-bold">{t('explore.empty.marketplace')}</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {loading ? placeholders.map((_, i) => (
                            <div key={i} className={`aspect-[9/16] rounded-[30px] animate-pulse ${mode==='velvet'?'bg-white/5':'bg-gray-200'}`}></div>
                        )) : items.map((item: any) => {
                             const assetUrl = item.video_url || item.image_url;
                             const isVid = isVideo(assetUrl);
                             return (
                             <div key={item.id} className={`rounded-[30px] overflow-hidden group relative hover:-translate-y-2 transition-all ${mode==='velvet'?S.panel:'bg-white shadow-lg border border-gray-100'}`}>
                                {isVid ? (
                                    <video src={assetUrl} className="aspect-[9/16] object-cover w-full" controls preload="metadata" playsInline crossOrigin="anonymous" />
                                ) : (
                                    <img src={assetUrl} className="aspect-[3/4] object-cover w-full" />
                                )}
                                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none">
                                    <p className="text-white text-[10px] font-bold uppercase tracking-widest">{item.profiles?.name || 'User'}</p>
                                </div>
                                <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                                    {tab === 'marketplace' ? (
                                        <>
                                            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                                                <span className="text-yellow-400 font-bold text-sm">{item.price} CR</span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleBuyClick(item); }}
                                                className="bg-white text-black p-2 rounded-full hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] active:scale-95"
                                                disabled={purchasing === item.id}
                                            >
                                                {purchasing === item.id ? <Loader2 size={20} className="animate-spin text-black"/> : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                        <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a3 3 0 1 0 6 0v-.75a.75.75 0 0 1 1.5 0v.75a4.5 4.5 0 1 1-9 0v-.75a.75.75 0 0 1 1.5 0v.75Z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        // Community / Remix Logic
                                        (item.for_sale || item.is_for_sale) ? (
                                           <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg flex items-center gap-1">
                                                <Lock size={12} className="text-white/70"/>
                                                <span className="text-white/70 font-bold text-[9px] uppercase tracking-wider">Private Prompt</span>
                                           </div>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate('/app', { state: { remixPrompt: item.prompt } }); }}
                                                className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-lg flex items-center gap-2 hover:bg-white hover:text-black transition-all group"
                                            >
                                                <span className="text-lg group-hover:rotate-180 transition-transform duration-500">🌪️</span>
                                                <span className="font-bold text-[10px] uppercase tracking-wider">Remix</span>
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        )})}
                    </div>
                </>
            )}

            {purchaseItem && (
                <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 animate-in fade-in">
                    <div className={`w-full max-w-sm p-6 rounded-[30px] ${mode==='velvet' ? S.panel : 'bg-white'}`}>
                        <h3 className={`text-xl font-bold uppercase mb-6 ${mode==='velvet'?'text-white':'text-black'}`}>{t('explore.buy.confirm_title')}</h3>
                        <div className="space-y-3 mb-6 text-sm">
                            <div className="flex justify-between"><span className="opacity-60">{t('explore.buy.item_price')}</span> <span>{purchaseItem.price}</span></div>
                            <div className="flex justify-between"><span className="opacity-60">{t('explore.buy.service_fee')} (2.5%)</span> <span>{(purchaseItem.price * 0.025).toFixed(2)}</span></div>
                            <div className={`flex justify-between font-bold text-lg border-t pt-3 ${mode==='velvet'?'border-white/10':'border-gray-200'}`}>
                                <span>{t('explore.buy.total')}</span>
                                <span className="text-[#C6A649]">{(purchaseItem.price * 1.025).toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={()=>setPurchaseItem(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-bold uppercase">{t('common.cancel')}</button>
                            <button onClick={confirmPurchase} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase ${S.btnGold}`}>{t('explore.buy.confirm_btn')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const LANDING_VID = "https://videos.pexels.com/video-files/3205917/3205917-hd_1920_1080_25fps.mp4";

  const toggleLang = () => i18n.changeLanguage(i18n.language === 'en' ? 'es' : 'en');

  return (
    <div className="bg-black min-h-screen text-white font-sans overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2"><div className="w-8 h-8 bg-[#C6A649]/10 rounded-lg flex items-center justify-center border border-[#C6A649]/20"><Play fill="#C6A649" className="text-[#C6A649] w-4 h-4 ml-0.5"/></div><div><h1 className="text-sm font-bold tracking-widest text-[#C6A649]">MivideoAI</h1></div></div>
        <div className="flex items-center gap-4">
            <button onClick={toggleLang} className="text-[10px] font-bold uppercase px-2 py-1 rounded border border-white/10 text-gray-400 hover:text-white transition-colors">{i18n.language?.substring(0, 2).toUpperCase() || 'EN'}</button>
            <button onClick={() => navigate('/login')} className="text-xs uppercase tracking-widest text-white/70 hover:text-white transition-colors">{t('landing.hero.login')}</button>
            <button onClick={() => navigate('/login?mode=register')} className="bg-[#C6A649] text-black text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full hover:bg-[#D4B355] transition-colors">{t('landing.hero.get_started')}</button>
        </div>
      </nav>
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0"><video src={LANDING_VID} autoPlay loop muted className="w-full h-full object-cover"/><div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black"></div></div>
        <div className="relative z-10 container mx-auto px-6 text-center mt-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm"><Sparkles size={12} className="text-[#C6A649]" /><span className="text-[10px] uppercase tracking-[0.2em] text-[#C6A649]">{t('landing.hero.badge')}</span></div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium text-white mb-6 leading-tight">Mivideo<span className="text-[#C6A649] italic">{t('landing.hero.title_suffix')}</span></h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto mb-10 font-light leading-relaxed">{t('landing.hero.subtitle')}</p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <button onClick={() => navigate('/login?mode=register')} className={`px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest ${S.btnGold} min-w-[200px]`}>{t('landing.hero.start_btn')}</button>
                <button className="px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm min-w-[200px]" onClick={() => document.getElementById('velvet-teaser')?.scrollIntoView({ behavior: 'smooth' })}>{t('landing.hero.demo_btn')}</button>
            </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce"><ChevronDown className="text-white/30" /></div>
      </section>
      <section id="velvet-teaser" className="py-32 relative overflow-hidden bg-black">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
            <h2 className="text-3xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white mb-8">{t('landing.velvet.title_prefix')} <br/><span className="italic text-purple-400">{t('landing.velvet.title_highlight')}</span></h2>
            <p className="text-white/50 max-w-lg mx-auto mb-12 leading-loose">{t('landing.velvet.description')}</p>
            <div className="relative inline-block group cursor-pointer">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#C6A649] to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <button onClick={() => navigate('/login?mode=register')} className="relative px-8 py-4 bg-black border border-white/10 rounded-lg leading-none flex items-center divide-x divide-gray-600"><span className="flex items-center space-x-5"><span className="pr-6 text-gray-100 uppercase tracking-widest text-xs">{t('landing.velvet.access_btn')}</span></span><span className="pl-6 text-purple-400 group-hover:text-purple-300 transition duration-200">&rarr;</span></button>
            </div>
        </div>
      </section>
    </div>
  );
};

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
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
            if(error) setErrorMsg(error.message); else alert(t('auth.check_email'));
        } else if (mode === 'login') {
            const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
            if(error) setErrorMsg(error.message);
        } else {
            const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/settings?mode=reset' });
            if(error) setErrorMsg(error.message); else alert(t('auth.email_sent'));
        }
    } catch(e) { setErrorMsg(t('auth.connection_error')); }
    setLoad(false);
  };
  const LOGIN_VID = "https://videos.pexels.com/video-files/3205917/3205917-hd_1920_1080_25fps.mp4";

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[100]">
      <video src={LOGIN_VID} autoPlay loop muted className="absolute inset-0 w-full h-full object-cover opacity-40"/>
      <div className={`relative z-10 w-full max-w-xs p-10 rounded-[40px] text-center ${S.panel}`}>
        <div className="mb-10"><div className="w-16 h-16 bg-[#C6A649]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#C6A649]/20 shadow-lg"><Play fill="#C6A649" className="text-[#C6A649] w-8 h-8 ml-1"/></div><h1 className={S.titleLuxe}>MivideoAI</h1><p className={S.subLuxe}>PRO</p></div>
        {errorMsg && <div className="mb-4 text-red-500 text-[10px] font-bold uppercase">{errorMsg}</div>}
        {mode !== 'forgot' ? (
            <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 bg-black/50 border border-white/10 p-4 rounded-2xl focus-within:border-[#C6A649] transition-colors"><Mail size={18} className="text-white/30"/><input value={email} onChange={e=>setEmail(e.target.value)} placeholder={t('auth.email_placeholder')} className="bg-transparent text-white text-xs w-full outline-none placeholder:text-white/20"/></div>
                <div className="flex items-center gap-4 bg-black/50 border border-white/10 p-4 rounded-2xl focus-within:border-[#C6A649] transition-colors"><Lock size={18} className="text-white/30"/><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder={t('auth.pass_placeholder')} className="bg-transparent text-white text-xs w-full outline-none placeholder:text-white/20"/></div>
            </div>
        ) : (
            <div className="mb-8 text-left"><p className="text-xs text-white/60 mb-4 px-1">{t('auth.recover_desc')}</p><div className="flex items-center gap-4 bg-black/50 border border-white/10 p-4 rounded-2xl"><Mail size={18} className="text-white/30"/><input value={email} onChange={e=>setEmail(e.target.value)} placeholder={t('auth.email_placeholder')} className="bg-transparent text-white text-xs w-full outline-none"/></div></div>
        )}
        <button onClick={handleSubmit} disabled={load} className={`w-full py-5 rounded-2xl text-[10px] ${S.btnGold}`}>{load ? "..." : (mode === 'login' ? t('auth.login') : mode === 'register' ? t('auth.register') : t('auth.send'))}</button>
        <div className="mt-8 flex justify-between text-[9px] text-white/40 uppercase tracking-widest border-t border-white/5 pt-6">
            {mode === 'login' ? (<><button onClick={()=>setMode('register')} className="hover:text-white">{t('auth.register')}</button><button onClick={()=>setMode('forgot')} className="hover:text-white">{t('auth.forgot')}</button></>) : (<button onClick={()=>setMode('login')} className="w-full hover:text-white">{t('auth.back_login')}</button>)}
        </div>
      </div>
    </div>
  );
};

const TalentPage = ({ list, add, del, notify, videos, profile }: any) => {
  const { mode } = useMode();
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localVideos, setLocalVideos] = useState<any[]>(videos || []);

  useEffect(() => {
    let active = true;
    if (videos && videos.length > 0) {
        setLocalVideos(videos);
    } else if (showGallery && (!localVideos || localVideos.length === 0)) {
        const fetchGens = async () => {
             const { data: { session } } = await supabase.auth.getSession();
             if(session) {
                 const { data } = await supabase.from('generations').select('*').eq('user_id', session.user.id).order('created_at', {ascending: false});
                 if(active && data) setLocalVideos(data);
             }
        };
        fetchGens();
    }
    return () => { active = false; };
  }, [videos, showGallery]);

  const save = () => {
      setErrorMsg(null);
      if(!img || !name) { setErrorMsg(t('talent.form.error_required')); return; }

      let finalPrice = 0;
      let finalForSale = false;

      if (isForSale) {
          finalPrice = parseFloat(createPrice);
          if (isNaN(finalPrice) || finalPrice <= 0) {
              setErrorMsg(t('talent.form.error_price'));
              return;
          }
          finalForSale = true;
      }

      add({
        id:Date.now().toString(),
        name,
        image_url:img,
        role,
        notes,
        for_sale: finalForSale,
        price: finalPrice
      });
      setOpen(false);
      setImg(null);
      setName('');
      setNotes('');
      setIsForSale(false);
      setCreatePrice('');
      notify(t('talent.created_success'));
      navigate('/app/explore?tab=marketplace');
  };
  const handleSell = async (id: string) => {
      if (!sellPrice) return;
      try {
          const { error } = await supabase.from('talents').update({ for_sale: true, price: parseInt(sellPrice) }).eq('id', id);
          if (!error) { notify(t('talent.listed_success')); setSellingId(null); setSellPrice(''); } else { notify(t('common.error')); }
      } catch (e) { notify(t('common.error')); }
  };
  const isVelvet = mode === 'velvet';
  const isVideo = (url: string) => url?.match(/\.(mp4|webm|mov|mkv)$/i);


  return (
    <div className="p-6 lg:p-12 pb-32 animate-in fade-in">
        <div className={`flex justify-between items-end border-b pb-8 mb-12 ${isVelvet?'border-white/10':'border-gray-200'}`}>
            <div><h2 className={`text-4xl font-bold uppercase tracking-[0.1em] ${isVelvet?'text-white':'text-gray-900'}`}>{t('talent.title')}</h2><p className={isVelvet ? S.subLuxe : "text-[9px] text-blue-600 mt-2 uppercase tracking-[0.4em] font-bold"}>{isVelvet ? t('talent.subtitle_velvet') : t('talent.subtitle_agency')}</p></div>
            <button onClick={()=>setOpen(!open)} className={`px-8 py-3 rounded-full text-[10px] uppercase font-bold transition-all flex items-center gap-2 border ${isVelvet ? 'border-white/20 text-white hover:bg-[#C6A649] hover:text-black' : 'border-gray-300 text-gray-700 hover:bg-black hover:text-white'}`}>{open?<X size={14}/>:<Plus size={14}/>} {open?t('common.cancel'):t('talent.new_btn')}</button>
        </div>
        {open && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 p-12 rounded-[40px] mb-12 transition-all duration-500 ${isVelvet ? S.panel : 'bg-white shadow-xl border border-gray-100'}`}>
                <div onClick={()=>setShowGallery(true)} className={`aspect-[3/4] rounded-[30px] border-2 border-dashed flex items-center justify-center relative overflow-hidden group cursor-pointer transition-all ${isVelvet ? 'bg-black/30 border-white/10 hover:border-[#C6A649]/50' : 'bg-gray-50 border-gray-300 hover:border-blue-500'}`}>
                    {img ? (isVideo(img) ? <video src={img} className="w-full h-full object-cover" controls preload="metadata" playsInline crossOrigin="anonymous"/> : <img src={img} className="w-full h-full object-cover"/>) : (<div className={`text-center ${isVelvet?'opacity-30':'opacity-50 text-gray-500'}`}><ImageIcon className="mx-auto mb-4 w-8 h-8"/><span className="text-[10px] font-bold uppercase tracking-widest">{t('talent.select_gallery')}</span></div>)}
                </div>
                <div className="flex flex-col justify-center gap-8">
                    {errorMsg && <div className="text-red-500 text-[10px] font-bold uppercase">{errorMsg}</div>}
                    <div className="space-y-4"><label className={`text-[10px] uppercase tracking-widest ${isVelvet?'text-white/40':'text-gray-400'}`}>{t('talent.form.name')}</label><input value={name} onChange={e=>setName(e.target.value)} className={isVelvet ? S.input : "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none transition-all"}/></div>
                    <div className="space-y-4"><label className={`text-[10px] uppercase tracking-widest ${isVelvet?'text-white/40':'text-gray-400'}`}>{t('talent.form.notes')}</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} className={`${isVelvet ? S.input : "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none transition-all"} h-24 resize-none`}/></div>

                    <div className="flex items-center justify-between">
                        <label className={`text-[10px] uppercase tracking-widest ${isVelvet?'text-white/40':'text-gray-400'}`}>{t('talent.form.sell')}</label>
                        <button onClick={()=>setIsForSale(!isForSale)} className={`w-12 h-6 rounded-full border relative transition-all ${isForSale ? 'bg-[#C6A649] border-[#C6A649]' : 'bg-gray-200 border-gray-300'}`}>
                            <div className={`absolute top-0.5 bottom-0.5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${isForSale ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                        </button>
                    </div>

                    {isForSale && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <label className={`text-[10px] uppercase tracking-widest ${isVelvet?'text-white/40':'text-gray-400'}`}>{t('talent.form.price')}</label>
                            <input type="number" value={createPrice} onChange={e=>setCreatePrice(e.target.value)} className={isVelvet ? S.input : "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none transition-all"} placeholder="100"/>
                        </div>
                    )}

                    {!isVelvet && (<div className="space-y-4"><div className="flex gap-4"><button onClick={()=>setRole('model')} className={`flex-1 py-3 border rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase transition-all ${role==='model'?'bg-black text-white border-black':'text-gray-400 border-gray-200'}`}><User size={14}/> {t('talent.form.model')}</button><button onClick={()=>setRole('brand')} className={`flex-1 py-3 border rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase transition-all ${role==='brand'?'bg-blue-600 text-white border-blue-600':'text-gray-400 border-gray-200'}`}><Briefcase size={14}/> {t('talent.form.brand')}</button></div></div>)}
                    <button onClick={save} className={`w-full py-5 rounded-2xl text-[10px] font-bold uppercase transition-transform hover:scale-[1.02] active:scale-95 ${isVelvet ? S.btnGold : 'bg-black text-white shadow-xl hover:bg-gray-800'}`}>{t('common.save')}</button>
                </div>
            </div>
        )}
        {showGallery && (
            <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8">
                <div className={`w-full max-w-4xl max-h-[80vh] overflow-y-auto p-8 rounded-[40px] ${isVelvet ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white'}`}>
                    <div className="flex justify-between items-center mb-8"><h3 className={`text-2xl font-bold uppercase tracking-widest ${isVelvet?'text-white':'text-black'}`}>{t('talent.select_gallery')}</h3><button onClick={()=>setShowGallery(false)}><X size={24} className={isVelvet?'text-white':'text-black'}/></button></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {localVideos && localVideos.map((v:any) => {
                             const assetUrl = v.video_url || v.url;
                             return (
                                <div key={v.id} onClick={()=>{setImg(assetUrl); setShowGallery(false);}} className="cursor-pointer group relative aspect-[9/16] rounded-xl overflow-hidden border border-transparent hover:border-[#C6A649]">
                                    {isVideo(assetUrl) ? <video src={assetUrl} className="w-full h-full object-cover" controls preload="metadata" playsInline crossOrigin="anonymous"/> : <img src={assetUrl} className="w-full h-full object-cover" />}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"/>
                                </div>
                             );
                        })}
                         {(!localVideos || localVideos.length === 0) && <p className="col-span-4 text-center text-gray-500 py-10">No generations found.</p>}
                    </div>
                </div>
            </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {list.map((inf:Talent) => (
                <div key={inf.id} className={`rounded-[30px] overflow-hidden relative group transition-all duration-500 hover:-translate-y-2 ${isVelvet ? S.panel : 'bg-white shadow-lg border border-gray-100'}`}>
                    {isVideo(inf.image_url) ? <video src={inf.image_url} className="aspect-[3/4] object-cover w-full group-hover:scale-105 transition-transform duration-700" controls preload="metadata" playsInline crossOrigin="anonymous"/> : <img src={inf.image_url} className="aspect-[3/4] object-cover w-full group-hover:scale-105 transition-transform duration-700"/>}
                    <div className="absolute bottom-0 inset-x-0 p-6 pt-20 flex justify-between items-end bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                        <div><span className="text-[10px] font-bold uppercase tracking-widest text-white block">{inf.name}</span>{(inf as any).for_sale && <span className="text-[8px] font-bold uppercase bg-[#C6A649] text-black px-2 py-0.5 rounded-full mt-1 inline-block ml-2">{t('talent.for_sale_badge')}</span>}</div>
                        <div className="flex gap-2">
                            {!(inf as any).for_sale && <button onClick={()=>setSellingId(sellingId === inf.id ? null : inf.id)} className="bg-white/10 p-2 rounded-full text-white/50 hover:text-[#C6A649] hover:bg-white/20"><ShoppingBag size={12}/></button>}
                            <button onClick={()=>del(inf.id)} className="bg-white/10 p-2 rounded-full text-white/50 hover:text-red-500 hover:bg-white/20"><X size={12}/></button>
                        </div>
                    </div>
                    {sellingId === inf.id && (
                        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                            <h3 className="text-white text-xs font-bold uppercase mb-4">{t('talent.sell_modal.title', {name: inf.name})}</h3>
                            <input type="number" placeholder={t('talent.sell_modal.price_placeholder')} value={sellPrice} onChange={(e)=>setSellPrice(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded p-2 text-white text-xs mb-4 text-center outline-none"/>

                            {sellPrice && !isNaN(parseFloat(sellPrice)) && (
                                <div className="text-[10px] text-white/70 mb-4 w-full text-left space-y-1 bg-white/5 p-3 rounded">
                                    <div className="flex justify-between"><span>{t('talent.sell_modal.selling_price')}:</span> <span className="text-white">{sellPrice}</span></div>
                                    {(inf.original_creator_id && profile?.id && inf.original_creator_id !== profile.id && (inf.sales_count || 0) < 5) && (
                                        <div className="flex justify-between text-red-400"><span>{t('talent.sell_modal.royalty')}:</span> <span>-{(parseFloat(sellPrice) * 0.10).toFixed(1)}</span></div>
                                    )}
                                    <div className="flex justify-between font-bold border-t border-white/10 pt-1 mt-1">
                                        <span>{t('talent.sell_modal.you_receive')}:</span>
                                        <span className="text-[#C6A649]">
                                            { (parseFloat(sellPrice) - ((inf.original_creator_id && profile?.id && inf.original_creator_id !== profile.id && (inf.sales_count || 0) < 5) ? parseFloat(sellPrice) * 0.10 : 0)).toFixed(1) }
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 w-full"><button onClick={()=>setSellingId(null)} className="flex-1 py-2 bg-white/10 text-white text-[10px] font-bold uppercase rounded">{t('common.cancel')}</button><button onClick={()=>handleSell(inf.id)} className="flex-1 py-2 bg-[#C6A649] text-black text-[10px] font-bold uppercase rounded">{t('talent.list_btn')}</button></div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
};

const GalleryPage = ({ videos, setVideos }: any) => {
  const { mode } = useMode();
  const { showToast } = useToast();
  const { t } = useTranslation();
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
            showToast(data.is_public ? t('gallery.published') : t('gallery.unpublished'), 'success');
            if (setVideos) {
                setVideos((prev: any[]) => prev.map(v => v.id === video.id ? { ...v, is_public: data.is_public } : v));
            }
        } else { throw new Error("Failed"); }
    } catch (e) { showToast(t('common.error'), 'error'); } finally { setPublishing(null); }
  };

  return (
  <div className={`p-6 lg:p-12 pb-32 animate-in fade-in ${mode==='velvet'?'':'bg-gray-50'}`}>
    <h2 className={`text-4xl font-bold uppercase tracking-[0.2em] mb-12 border-b pb-8 ${mode==='velvet'?'text-white border-white/10':'text-gray-900 border-gray-200'}`}>{t('gallery.title')}</h2>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {videos.map((v:any) => (
            <div key={v.id} className={`rounded-[30px] overflow-hidden group relative hover:-translate-y-2 transition-all ${mode==='velvet'?S.panel:'bg-white shadow-lg border border-gray-100'}`}>
                <video src={v.video_url || v.url} className="aspect-[9/16] object-cover w-full" controls preload="metadata" playsInline crossOrigin="anonymous"/>
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
  const { t } = useTranslation();
  const isVelvet = mode === 'velvet';

  return (
    <div className="p-6 lg:p-12 pb-32 max-w-7xl mx-auto animate-in fade-in">
      <div className="text-center mb-16">
          <h2 className={`text-4xl lg:text-5xl font-bold uppercase tracking-[0.2em] mb-4 ${isVelvet ? 'text-white' : 'text-black'}`}>{t('billing.title')}</h2>
          <div className="flex items-center justify-center gap-4 mt-8">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${!annual ? (isVelvet ? 'text-[#C6A649]' : 'text-blue-600') : (isVelvet ? 'text-white/40' : 'text-gray-600')}`}>{t('billing.monthly')}</span>
              <button onClick={()=>setAnnual(!annual)} className={`w-12 h-6 rounded-full relative p-1 transition-colors ${isVelvet ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}><div className={`w-4 h-4 rounded-full shadow-lg transition-transform duration-300 ${annual ? 'translate-x-6' : ''} ${isVelvet ? 'bg-[#C6A649]' : 'bg-white'}`}></div></button>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${annual ? (isVelvet ? 'text-[#C6A649]' : 'text-blue-600') : (isVelvet ? 'text-white/40' : 'text-gray-600')}`}>{t('billing.annual')} <span className={`${isVelvet ? 'bg-[#C6A649] text-black' : 'bg-blue-600 text-white'} px-2 py-0.5 rounded text-[8px] ml-1`}>{t('billing.discount')}</span></span>
          </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {Object.entries(PRICING_META).map(([k, p]) => {
              const price = annual && (p as any).yearlyPrice ? (p as any).yearlyPrice : p.price;
              const features = t(`pricing.${k}.features`, { returnObjects: true }) as string[];
              return (
                  <div key={k} className={`p-10 rounded-[40px] text-center flex flex-col items-center relative overflow-hidden group hover:scale-105 transition-transform duration-500 ${isVelvet ? S.panel : 'bg-white border border-gray-200 shadow-xl'} ${p.popular ? (isVelvet ? 'border-[#C6A649]/50 shadow-[0_0_50px_rgba(198,166,73,0.15)]' : 'border-blue-500 shadow-lg scale-105') : ''}`}>
                      {p.popular && <div className={`absolute top-0 inset-x-0 h-1.5 ${isVelvet ? 'bg-gradient-to-r from-[#C6A649] to-[#FBF5B7]' : 'bg-blue-500'}`}/>}
                      {p.popular && <div className={`${isVelvet ? 'bg-[#C6A649]/20 text-[#C6A649] border-[#C6A649]/30' : 'bg-blue-50 text-blue-600 border-blue-200'} text-[8px] font-bold px-4 py-1 rounded-full uppercase tracking-widest mb-6 border`}>{t('billing.recommended')}</div>}
                      <h3 className={`text-xl font-bold uppercase tracking-[0.2em] mb-2 ${isVelvet ? 'text-white' : 'text-black'}`}>{t(`pricing.${k}.name`)}</h3>
                      <div className={`text-3xl md:text-5xl font-bold mb-8 tracking-tighter ${isVelvet ? 'text-white' : 'text-black'}`}>${price}<span className={`text-sm font-normal ml-2 ${isVelvet ? 'text-white/30' : 'text-gray-600'}`}>/mo</span></div>
                      <div className={`w-full h-px mb-8 ${isVelvet ? 'bg-white/5' : 'bg-gray-100'}`}></div>
                      <div className="space-y-5 mb-10 w-full text-left">
                          <div className={`p-3 rounded-xl flex items-center justify-center gap-3 border mb-6 ${isVelvet ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}><Zap size={14} className={isVelvet ? 'text-[#C6A649]' : 'text-blue-500'}/><span className={`text-xs font-bold uppercase tracking-widest ${isVelvet ? 'text-white' : 'text-black'}`}>{t('studio.credits_cost', { cost: p.creds })}</span></div>
                          {features.map(f => <div key={f} className={`flex items-center gap-3 text-[10px] uppercase tracking-widest ${isVelvet ? 'text-white/60' : 'text-black'}`}><Check size={10} className={isVelvet ? 'text-[#C6A649]' : 'text-blue-500'}/> {f}</div>)}
                      </div>
                      <button onClick={()=>onSelect(k, annual)} className={`w-full py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] ${p.popular ? (isVelvet ? S.btnGold : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg') : (isVelvet ? 'bg-white/5 text-white hover:bg-white hover:text-black transition-all' : 'bg-black text-white hover:bg-gray-800 transition-all')}`}>{t('billing.select_plan')}</button>
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
  const { t } = useTranslation();
  const isVelvet = mode === 'velvet';

  const save = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if(user) {
          const { error } = await supabase.from('profiles').update({ instagram: data.instagram, telegram: data.telegram, phone: data.phone }).eq('id', user.id);
          if(error) { notify(t('settings.saved_error')); } else { notify(t('settings.saved_success')); }
      }
  };
  return (
    <div className="p-6 lg:p-12 max-w-4xl mx-auto">
       <h2 className={`text-2xl md:text-4xl font-bold uppercase tracking-[0.2em] mb-12 border-b pb-8 ${isVelvet ? 'text-white border-white/10' : 'text-gray-900 border-gray-200'}`}>{t('settings.title')}</h2>
       <div className={`p-10 rounded-[40px] mb-12 flex items-center gap-10 ${isVelvet ? S.panel : 'bg-white shadow-xl border border-gray-200'}`}>
           <div className={`w-24 h-24 rounded-full p-[2px] flex items-center justify-center ${isVelvet ? 'bg-gradient-to-br from-[#C6A649] to-black' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}><span className={`text-3xl font-bold ${isVelvet ? 'text-[#C6A649]' : 'text-white'}`}>JD</span></div>
           <div><h3 className={`text-2xl font-bold ${isVelvet ? 'text-white' : 'text-gray-900'}`}>{data.name}</h3><p className={`text-xs uppercase tracking-widest font-bold mt-1 ${isVelvet ? 'text-[#C6A649]' : 'text-blue-600'}`}>{t('settings.plan_pro')}</p></div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
           <div className="space-y-2"><label className={`text-[10px] uppercase tracking-widest ${isVelvet ? 'text-white/40' : 'text-gray-400'}`}>{t('settings.instagram')}</label><input value={data.instagram || ''} onChange={e=>setData({...data, instagram:e.target.value})} className={isVelvet ? S.input : "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none transition-all focus:border-blue-500"} placeholder="@usuario"/></div>
           <div className="space-y-2"><label className={`text-[10px] uppercase tracking-widest ${isVelvet ? 'text-white/40' : 'text-gray-400'}`}>{t('settings.telegram')}</label><input value={data.telegram || ''} onChange={e=>setData({...data, telegram:e.target.value})} className={isVelvet ? S.input : "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none transition-all focus:border-blue-500"} placeholder="@usuario"/></div>
           <div className="space-y-2"><label className={`text-[10px] uppercase tracking-widest ${isVelvet ? 'text-white/40' : 'text-gray-400'}`}>{t('settings.phone')}</label><input value={data.phone || ''} onChange={e=>setData({...data, phone:e.target.value})} className={isVelvet ? S.input : "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none transition-all focus:border-blue-500"} placeholder="+123456789"/></div>
       </div>
       <button onClick={save} className={`w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs ${isVelvet ? S.btnGold : 'bg-black text-white hover:bg-gray-800'}`}>{t('common.save')}</button>
    </div>
  );
};

const StudioPage = ({ onGen, credits, notify, onUp, userPlan, talents, profile }: any) => {
  const { mode } = useMode();
  const location = useLocation();
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

  // Voice State
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceScript, setVoiceScript] = useState('');
  const [voiceId, setVoiceId] = useState(VOICES[0].id);

  // Cost State
  const [totalCost, setTotalCost] = useState(0);

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Generating script...');
  const [resUrl, setResUrl] = useState<string|null>(null);
  const [modal, setModal] = useState(false);

  const init = useRef(false);
  const DEMO_IMG = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop";
  const DEMO_PROD = "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop";

  useEffect(() => {
      if(!init.current) {
          if (location.state?.remixPrompt) {
              setPrompt(location.state.remixPrompt);
              notify(t('studio.remix_loaded'));
          } else {
              setImg(DEMO_IMG); setProd(DEMO_PROD); setPrompt("Cinematic slow motion shot, elegant lighting, 8k resolution");
          }
          init.current=true;
      }
      if (mode === 'velvet') { setVelvetFilter(true); } else { setVelvetFilter(false); }
  }, [mode, location.state]);

  useEffect(() => {
      let c = dur * 1;
      if (voiceMode) c += 20;
      if (mode === 'velvet' || velvetFilter) c += 10;
      setTotalCost(c);
  }, [dur, voiceMode, mode, velvetFilter]);

  const getEstimatedTime = () => {
      let seconds = 45; // Base
      if (voiceMode) seconds += 30;
      if (mode === 'velvet' || velvetFilter) seconds += 20; // High Quality / Remix

      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `~${m > 0 ? `${m} min ` : ''}${s} sec`;
  };

  useEffect(() => {
      if (!loading) return;
      const msgs = ["Writing script...", "Rendering lights...", "Creating magic in MivideoAI..."];
      if (voiceMode) {
          msgs.splice(1, 0, "Lip syncing...");
      }
      let i = 0;
      setStatusMsg(msgs[0]);
      const interval = setInterval(() => {
          i = (i + 1) % msgs.length;
          setStatusMsg(msgs[i]);
      }, 10000);
      return () => clearInterval(interval);
  }, [loading, voiceMode]);

  const handleFile = (e:any, setter:any) => { const f = e.target.files[0]; if(f) { const r=new FileReader(); r.onload=()=>setter(r.result); r.readAsDataURL(f); } };

  const handlePromptInjection = (text: string) => { setPrompt(prev => prev + (prev ? ", " : "") + text); };

  const generate = async () => {
      if(!img && !vid) return;
      const cost = totalCost;
      if(!profile?.is_admin && credits < cost) { notify(t('studio.insufficient_credits')); onUp(); return; }
      setLoading(true); setResUrl(null);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          const effectiveMode = mode === 'velvet' ? 'velvet' : 'standard';
          const effectiveVelvetStyle = mode === 'velvet' ? velvetStyle : null;

          const payload = {
              image: img,
              endImage: prod,
              inputVideo: vid,
              prompt,
              duration: dur,
              aspectRatio: ratio,
              mode: effectiveMode,
              velvetStyle: effectiveVelvetStyle,
              voiceScript: (voiceMode && voiceScript) ? voiceScript : undefined,
              voiceId: (voiceMode && voiceId) ? voiceId : undefined
          };

          const r = await fetch(`${CONFIG.API_URL}/generate`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
              body: JSON.stringify(payload)
          });
          const d = await r.json();
          if(d.videoUrl) {
              setResUrl(d.videoUrl);
              // Use returned ID if available, fallback to timestamp only if null (though backend should return ID now)
              const realId = d.id || Date.now().toString();
              onGen({url: d.videoUrl, cost, id: realId, date: new Date().toLocaleDateString(), prompt, aspectRatio: ratio});
              if (d.voiceWarning) notify(`Video generado (Voz falló: se cobraron ${cost - 20}cr)`);
              else notify(t('studio.generated_success'));
          } else throw new Error(d.error);
      } catch(e:any) { console.error(e); notify(t('auth.connection_error')); } finally { setLoading(false); }
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
      {modal && <VelvetModal onClose={()=>setModal(false)} onOk={()=>{setModal(false); setVelvetFilter(true); notify(t('studio.velvet_active') + " 🔥");}}/>}
      <div className="lg:col-span-2 space-y-6">
        <div className={`p-8 rounded-[40px] border transition-all duration-300 ${panelClass}`}>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] flex gap-3"><span className={mode==='velvet'?"text-[#C6A649]":"text-blue-600"}>01</span> Reference Image <Tooltip txt="Upload the photo you want to animate."/></h2>
                <div className={`p-1.5 rounded-full border flex ${mode==='velvet'?'bg-black/40 border-white/10':'bg-gray-100 border-gray-200'}`}>
                    <button onClick={()=>{setType('img'); setVid(null);}} className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase transition-all ${toggleClass(type==='img')}`}>{t('studio.tabs.photo')}</button>
                    <button onClick={()=>{setType('vid'); setImg(null);}} className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase transition-all ${toggleClass(type==='vid')}`}>{t('studio.tabs.remix')}</button>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div id="studio-source-upload" className={`aspect-[3/4] rounded-[30px] border-2 border-dashed relative overflow-hidden group transition-all duration-300 ${type==='vid'?'border-blue-500/30':(mode==='velvet'?'border-white/10 hover:border-[#C6A649]/50':'border-gray-200 hover:border-blue-500')}`}>
                    {type==='img' ? ( img ? (<><img src={img} className="w-full h-full object-cover"/>{img===DEMO_IMG && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#C6A649] text-black text-[8px] font-bold px-3 py-1 rounded-full uppercase shadow-lg flex gap-2"><Sparkles size={10}/> {t('studio.upload.demo')}</div>}<button onClick={()=>{setImg(null);}} className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white hover:bg-red-500 transition-all z-20"><X size={14}/></button></>) : <div className={`absolute inset-0 flex flex-col items-center justify-center ${mode==='velvet'?'text-white/20':'text-gray-400'}`}><Upload className="mb-4 w-8 h-8"/><span className="text-[9px] uppercase font-bold tracking-widest text-center">{t('studio.upload.subject')}</span><input type="file" onChange={e=>handleFile(e, setImg)} className="absolute inset-0 opacity-0 cursor-pointer"/></div> ) : ( vid ? (<><video src={vid} className="w-full h-full object-cover opacity-50" controls preload="metadata" playsInline crossOrigin="anonymous"/><button onClick={()=>setVid(null)} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-red-500 z-20"><X size={14}/></button></>) : <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-500/40"><Film className="mb-4 w-8 h-8"/><span className="text-[9px] uppercase font-bold tracking-widest text-center">{t('studio.upload.video')}</span><input type="file" onChange={e=>handleFile(e, setVid)} className="absolute inset-0 opacity-0 cursor-pointer"/></div> )}
                </div>
                <div className="flex flex-col gap-4">
                     <div id="studio-product-upload" className={`aspect-[3/4] rounded-[30px] border-2 border-dashed relative overflow-hidden group transition-all duration-300 ${mode==='velvet'?'border-white/10 bg-black/20 hover:border-[#C6A649]/50':'border-gray-200 bg-gray-50 hover:border-blue-500'}`}>
                        {prod ? (<><img src={prod} className="w-full h-full object-cover"/>{prod===DEMO_PROD && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#C6A649] text-black text-[8px] font-bold px-3 py-1 rounded-full uppercase shadow-lg flex gap-2"><Sparkles size={10}/> {t('studio.upload.demo')}</div>}<button onClick={()=>setProd(null)} className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white hover:bg-red-500 transition-all z-20"><X size={14}/></button></>) : <div className={`absolute inset-0 flex flex-col items-center justify-center ${mode==='velvet'?'text-white/20':'text-gray-400'}`}><Plus className="mb-4 w-8 h-8"/><span className="text-[9px] uppercase font-bold tracking-widest text-center">{t('studio.upload.product')}</span><input type="file" onChange={e=>handleFile(e, setProd)} className="absolute inset-0 opacity-0 cursor-pointer"/></div>}
                     </div>
                </div>
            </div>
            {talents && talents.length > 0 && (
                <div className={`mt-6 rounded-3xl p-6 border transition-all ${mode==='velvet'?'bg-black/40 border-white/10':'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-4 px-2"><p className="text-[9px] opacity-50 uppercase tracking-widest flex items-center gap-2"><Sparkles size={10}/> {t('studio.quick_cast')}</p></div>
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
            <div className="flex justify-between items-center mb-8"><h2 className="text-xs font-bold uppercase tracking-[0.2em] flex gap-3"><span className={mode==='velvet'?"text-[#C6A649]":"text-blue-600"}>02</span> {t('studio.settings')}</h2>{mode === 'velvet' && (<div className="px-4 py-1.5 rounded-full border border-[#C6A649]/30 bg-[#C6A649]/10 text-[#C6A649] text-[9px] font-bold uppercase tracking-widest flex items-center gap-2"><Flame size={12}/> {t('studio.velvet_active')}</div>)}</div>
            <div className="grid grid-cols-4 gap-4 mb-8">
                {CAMS.map(m => (<button key={m.id} onClick={()=>setCam(m.id)} className={`relative p-4 rounded-3xl border flex flex-col items-center gap-3 transition-all group overflow-hidden ${cam===m.id ? (mode==='velvet' ? 'bg-[#C6A649] border-[#C6A649] text-black shadow-lg' : 'bg-black border-black text-white shadow-lg') : (mode==='velvet' ? 'bg-black/40 border-white/5 text-gray-500 hover:bg-white/5' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-white hover:border-gray-300')}`}>{m.icon}<span className="text-[7px] font-bold uppercase tracking-widest">{t(`cams.${m.id}.label`)}</span></button>))}
            </div>
            {mode === 'velvet' && (
                <div className="grid grid-cols-4 gap-3 mb-6 animate-in fade-in slide-in-from-top-4">
                    {VELVET_STYLES.map(v => (<button key={v.id} onClick={()=>{setVelvetStyle(v.id); handlePromptInjection(t(`velvet_styles.${v.id}.desc`));}} className={`p-3 rounded-2xl border transition-all text-center group ${velvetStyle===v.id ? (mode==='velvet' ? 'bg-pink-500/10 border-pink-500 text-white' : 'bg-purple-100 border-purple-500 text-purple-900') : (mode==='velvet' ? 'bg-black/40 border-white/5 text-white/50' : 'bg-white border-gray-200 text-gray-400')}`}><p className="text-[8px] font-bold uppercase tracking-widest mb-1">{t(`velvet_styles.${v.id}.name`)}</p></button>))}
                </div>
            )}

            {/* LUXEVOICE UI */}
            <div className={`p-6 rounded-3xl border mb-6 transition-all overflow-hidden relative ${mode==='velvet'?'bg-[#050505] border-white/10':'bg-white border-gray-200'}`}>
                {/* Header with Pulse Animation */}
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${voiceMode ? (mode==='velvet'?'bg-[#C6A649]/20 border-[#C6A649]/50 text-[#C6A649]':'bg-blue-500/10 border-blue-500/50 text-blue-600') : 'bg-white/5 border-white/5 text-gray-500'}`}>
                            <Mic size={16}/>
                        </div>
                        <div>
                            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${mode==='velvet'?'text-white':'text-gray-900'}`}>LuxeVoice™</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-[8px] font-mono ${mode==='velvet'?'text-white/40':'text-gray-500'}`}>MODULE_V2.0</span>
                                {voiceMode && <div className="flex gap-0.5 items-end h-2">
                                    <div className="w-0.5 bg-[#C6A649] animate-[bounce_1s_infinite] h-full"></div>
                                    <div className="w-0.5 bg-[#C6A649] animate-[bounce_1.2s_infinite] h-2/3"></div>
                                    <div className="w-0.5 bg-[#C6A649] animate-[bounce_0.8s_infinite] h-1/2"></div>
                                </div>}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setVoiceMode(!voiceMode)}
                        className={`w-12 h-6 rounded-full relative transition-all duration-300 border ${voiceMode ? (mode==='velvet'?'bg-[#C6A649]/10 border-[#C6A649]':'bg-blue-600 border-blue-600') : 'bg-transparent border-gray-600'}`}
                    >
                         <div className={`absolute top-0.5 bottom-0.5 w-5 rounded-full transition-all duration-300 shadow-lg ${voiceMode ? (mode==='velvet'?'right-0.5 bg-[#C6A649]':'right-0.5 bg-white') : 'left-0.5 bg-gray-500'}`}/>
                    </button>
                </div>

                {voiceMode && (
                    <div className="animate-in fade-in slide-in-from-top-4 space-y-6">
                        {/* Card Grid Selector */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {VOICES.map(v => {
                                const active = voiceId === v.id;
                                return (
                                <button
                                    key={v.id}
                                    onClick={() => setVoiceId(v.id)}
                                    className={`relative p-4 rounded-2xl border transition-all duration-300 group overflow-hidden text-left ${active
                                        ? (mode==='velvet' ? 'bg-[#C6A649]/10 border-[#C6A649] shadow-[0_0_30px_rgba(198,166,73,0.15)]' : 'bg-blue-50 border-blue-500 shadow-lg')
                                        : (mode==='velvet' ? 'bg-white/5 border-white/5 hover:border-white/20' : 'bg-gray-50 border-gray-200 hover:border-gray-300')}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`p-2 rounded-lg ${active ? (mode==='velvet'?'bg-[#C6A649] text-black':'bg-blue-600 text-white') : 'bg-black/20 text-gray-500'}`}>
                                            <Activity size={14}/>
                                        </div>
                                        <div className="flex gap-1">
                                            <span className="text-[10px] opacity-50">🇺🇸</span>
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${active ? 'border-current' : 'border-transparent'}`}>
                                                <Play size={8} className={active ? 'fill-current' : 'opacity-50'}/>
                                            </div>
                                        </div>
                                    </div>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${active ? (mode==='velvet'?'text-white':'text-blue-900') : (mode==='velvet'?'text-gray-400':'text-gray-600')}`}>{v.name}</p>
                                    <p className={`text-[8px] font-mono opacity-60 ${active ? 'text-current' : 'text-gray-500'}`}>{v.desc}</p>
                                </button>
                            )})}
                        </div>

                        {/* Terminal Script Input */}
                        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-inner group focus-within:border-[#C6A649]/50 transition-colors">
                            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                                </div>
                                <span className="text-[8px] font-mono text-white/30 uppercase">Script_Editor.exe</span>
                            </div>
                            <textarea
                                value={voiceScript}
                                onChange={e => setVoiceScript(e.target.value)}
                                maxLength={200}
                                placeholder="// Enter voice generation script..."
                                className="w-full h-32 bg-transparent text-xs font-mono p-4 text-green-400 placeholder:text-green-900/50 outline-none resize-none selection:bg-green-900/30"
                            />
                            <div className="px-4 py-2 flex justify-between items-center border-t border-white/5 bg-white/5">
                                <div className="flex gap-2">
                                     <span className="text-[8px] font-mono text-white/20">LN 1, COL {voiceScript.length}</span>
                                </div>
                                <span className={`text-[8px] font-mono ${voiceScript.length > 180 ? 'text-red-500' : 'text-green-600'}`}>
                                    {voiceScript.length}/200 CHARS
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="relative group"><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder={t('studio.prompt_placeholder')} className={`${inputClass} h-32 mb-8 resize-none p-6 text-sm ${mode==='velvet' ? 'border-pink-900/50 focus:border-pink-500' : ''}`}/><div className="absolute bottom-10 right-4"><Sparkles size={16} className={`${mode==='velvet'?'text-[#C6A649]':'text-blue-500'} opacity-50`}/></div></div>
            <div className={`grid grid-cols-2 gap-8 pt-6 border-t ${mode==='velvet'?'border-white/5':'border-gray-100'}`}>
                <div className="space-y-4">
                    <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest opacity-40">{t('studio.duration')}</span><span className={`font-bold text-xs ${mode==='velvet'?'text-[#C6A649]':'text-blue-600'}`}>{dur}s</span></div>
                    <div className={`flex gap-2 p-1.5 rounded-2xl border ${mode==='velvet'?'bg-black/40 border-white/10':'bg-gray-100 border-gray-200'}`}><button onClick={()=>setDur(5)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${toggleClass(dur===5)}`}>5s (10cr)</button><button onClick={()=>setDur(10)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${toggleClass(dur===10)}`}>10s (20cr)</button></div>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest opacity-40">{t('studio.ratio')}</span></div>
                    <div className={`flex gap-2 p-1.5 rounded-2xl border ${mode==='velvet'?'bg-black/40 border-white/10':'bg-gray-100 border-gray-200'}`}>{RATIOS.map(r => (<button key={r.id} onClick={() => setRatio(r.id)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${toggleClass(ratio === r.id)}`}>{t(r.labelKey)}</button>))}</div>
                </div>
            </div>
        </div>
        {/* CRITICAL UI: DO NOT MODIFY */}
        <button
          id="studio-generate-btn"
          onClick={generate}
          disabled={loading || (!img && !vid) || (!profile?.is_admin && credits < totalCost)}
          className={`w-full py-7 rounded-[32px] font-bold uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 fixed bottom-6 left-4 right-4 lg:static lg:w-full z-50 shadow-2xl transition-all duration-300 ${mode==='velvet' ? (velvetFilter ? S.btnVelvet : S.btnGold) : 'bg-black text-white shadow-lg hover:bg-gray-800 hover:shadow-xl active:scale-95'}`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={18} /> Creating magic...
            </span>
          ) : (
            <span>Generate Video ({totalCost} CR)</span>
          )}
        </button>
      </div>
      <div className="lg:col-span-3 relative z-10 flex flex-col pt-0 h-[calc(100vh-100px)] sticky top-8">
         <div className={`w-full h-full rounded-[40px] border overflow-hidden shadow-2xl relative transition-all duration-500 flex flex-col ${mode==='velvet' ? 'bg-black border-white/10' : 'bg-white border-gray-200'}`}>
            <div className={`flex-1 flex items-center justify-center p-8 transition-colors ${mode==='velvet' ? 'bg-black/50' : 'bg-gray-50'}`}>
                 <div className={`relative w-full max-h-full transition-all duration-500 shadow-2xl ${ratio==='16:9'?'aspect-video w-full':ratio==='1:1'?'aspect-square h-full':'aspect-[9/16] h-full'} ${mode==='velvet' ? 'bg-black' : 'bg-black'}`}>
                    <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20 pointer-events-none opacity-60"><div className="text-[10px] text-white font-mono flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> REC</div><div className="text-[10px] text-white font-mono">{dur}s • 4K</div></div>
                    {!resUrl && !loading && (<div className="absolute inset-0 flex flex-col items-center justify-center text-white/10 gap-6 border border-white/5"><div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center"><Video size={40} strokeWidth={1}/></div><span className="text-[9px] uppercase tracking-[0.4em] font-light">Preview</span></div>)}
                    {loading && (
                        <div className="absolute inset-0 bg-[#050505] z-30 flex flex-col items-center justify-center p-8 text-center">
                            <div className={`w-20 h-20 border-t-2 border-r-2 rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(198,166,73,0.2)] ${mode==='velvet' ? 'border-[#C6A649]' : 'border-black shadow-lg'}`}></div>
                            <p className={`text-[10px] uppercase tracking-widest animate-pulse font-bold mb-4 ${mode==='velvet'?'text-[#C6A649]':'text-black'}`}>{statusMsg}</p>
                            <p className={`text-[9px] uppercase tracking-widest font-bold opacity-50 ${mode==='velvet'?'text-white':'text-gray-600'}`}>Estimated time: {getEstimatedTime()}</p>
                        </div>
                    )}
                    {resUrl && <video src={resUrl} className="w-full h-full object-cover" controls preload="metadata" playsInline crossOrigin="anonymous"/>}
                 </div>
            </div>
            <div className={`p-6 border-t flex justify-center backdrop-blur-sm transition-colors ${mode==='velvet'?'border-white/5 bg-black/40':'border-gray-100 bg-white/40'}`}>
                {resUrl ? (<a href={resUrl} download className={`px-12 py-4 rounded-full text-[10px] font-bold uppercase hover:scale-105 transition-transform flex gap-3 shadow-2xl items-center ${mode==='velvet' ? 'bg-white text-black' : 'bg-black text-white'}`}><Download size={16}/> {t('studio.download')}</a>) : (<div className={`text-[9px] uppercase tracking-widest ${mode==='velvet'?'text-white/30':'text-gray-400'}`}>{t('studio.ready')}</div>)}
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

const ProtectedRoute = ({ children, requireAdmin, profile }: { children: any, requireAdmin?: boolean, profile?: UserProfile }) => {
    if (requireAdmin) {
        const isAdmin = profile?.is_admin === true || profile?.role === 'admin';
        if (!isAdmin) return <Navigate to="/" replace />;
    }
    return children;
};

function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [influencers, setInfluencers] = useState<Talent[]>([]);
  const [credits, setCredits] = useState(0);
  const [userPlan, setUserPlan] = useState<'starter' | 'creator' | 'agency'>('starter');
  const [selPlan, setSelPlan] = useState<{key: string, annual: boolean} | null>(null);
  const [profile, setProfile] = useState<UserProfile>({ name: "User", email: "", plan: 'starter' });
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
            image_url: typeof inf.image_url === 'string' ? inf.image_url : '',
            role: inf.role || 'model',
            dna_prompt: inf.dna_prompt || '',
            user_id: user.id,
            original_creator_id: user.id,
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) initData(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) initData(session.user);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const initData = async (user: SupabaseUser) => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
           setProfile(data);
           setCredits(data.credits || 0);
           setUserPlan(data.plan || 'starter');
           if (data.plan === 'starter' && !data.is_admin) {
              setMode('agency');
           }
        } else {
            // Fallback for email if profile fetch fails or if email is not in profile
            setProfile(prev => ({ ...prev, email: user.email || "" }));
        }

        // Load talents
        const { data: tal } = await supabase.from('talents').select('*').eq('user_id', user.id).order('created_at', {ascending: false});
        if(tal) setInfluencers(tal);

        // Load generations
        const { data: gens } = await supabase.from('generations').select('*').eq('user_id', user.id).order('created_at', {ascending: false});
        if(gens) setVideos(gens);

    } catch (error) {
         console.error(error);
         // Ensure we at least have the email
         setProfile(prev => ({ ...prev, email: user.email || "" }));
    } finally {
         setLoading(false);
    }
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
            <Route
                path="/admin"
                element={
                    <ProtectedRoute requireAdmin={true} profile={profile}>
                        <Admin />
                    </ProtectedRoute>
                }
            />
            <Route path="/app" element={<ProtectedLayout session={session} credits={credits} handleLogout={handleLogout} setSelPlan={setSelPlan} profile={profile} mode={mode} selPlan={selPlan} notify={notify} />}>
                <Route index element={<StudioPage onGen={handleVideoSaved} influencers={influencers} credits={credits} notify={notify} onUp={()=>setSelPlan({key:'creator', annual:true})} userPlan={userPlan} talents={influencers} profile={profile}/>}/>
                <Route path="explore" element={<ExplorePage />} />
                <Route path="talent" element={<TalentPage list={influencers} add={handleInf.add} del={handleInf.del} notify={notify} videos={videos} profile={profile}/>}/>
                <Route path="gallery" element={<GalleryPage videos={videos} setVideos={setVideos}/>}/>
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
