import MobileLayout from './components/MobileLayout';
import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Loader2, Play, Sparkles, ChevronDown, ChevronRight, Mail, Lock, Upload, X, Plus, User,
    Briefcase, Camera, ShoppingBag, Globe, Download, Zap, Check, Video, Users,
    Image as ImageIcon, CreditCard, Settings, LogOut, Crown, Film, Move, ZoomIn,
    Heart, Smartphone, Monitor, Square, Flame, LayoutDashboard, Info, Mic, Activity, DollarSign, TrendingUp
} from 'lucide-react';
import { createClient, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase'; // NEW IMPORT
import { useTranslation } from 'react-i18next';
import './i18n';
import { VideoCard } from './components/VideoCard';
import { EarningsDashboard } from './pages/EarningsDashboard';
import { useMode } from './context/ModeContext';
// import { LandingPage } from './pages/LandingPage';
// import { AccessPending } from './pages/AccessPending';
import { AdminConsole } from './pages/admin/AdminConsole';
import ModelSelector from './components/ModelSelector';
import { ActivateAccount } from './pages/ActivateAccount';
import LandingWaitlist from './pages/LandingWaitlist';
import StudioConsole from './pages/StudioConsole';

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
    { id: 'static', icon: <Move size={18} /> },
    { id: 'zoom', icon: <ZoomIn size={18} /> },
    { id: 'eye', icon: <Heart size={18} /> },
    { id: 'hand', icon: <Video size={18} /> }
];

const RATIOS = [
    { id: '9:16', labelKey: 'ratios.stories', icon: <Smartphone size={14} /> },
    { id: '16:9', labelKey: 'ratios.cinema', icon: <Monitor size={14} /> },
    { id: '1:1', labelKey: 'ratios.square', icon: <Square size={14} /> }
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

// Toast Context
type ToastType = 'success' | 'error' | 'info';
interface ToastContextType { showToast: (msg: string, type?: ToastType) => void; }
const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<{ msg: string, type: ToastType } | null>(null);

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
                    {toast.type === 'error' ? <X size={18} /> : toast.type === 'success' ? <Check size={18} /> : <Info size={18} />}
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
        <Info size={14} className="text-white/30 hover:text-[#C6A649] transition-colors" />
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
                    <button onClick={onClose} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"><X size={20} /></button>
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-tr from-pink-600 to-purple-900 rounded-full flex items-center justify-center border border-pink-500/50 shadow-lg">
                        <Flame size={32} className="text-white fill-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400 uppercase tracking-[0.2em] mb-4">{t('modals.velvet.title')}</h2>
                    <div className="inline-block px-4 py-1 border border-pink-500/30 rounded-full bg-pink-500/10 mb-6"><span className="text-[9px] font-bold text-pink-400 uppercase tracking-[0.3em]">{t('modals.velvet.adults_only')}</span></div>
                    <p className="text-white/50 text-xs mb-8 leading-relaxed">{t('modals.velvet.desc')}</p>
                    <button onClick={onOk} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 group ${S.btnVelvet}`}><span>{t('modals.velvet.unlock')}</span> <ChevronRight size={16} /></button>
                </div>
            </div>
        </div>
    )
};

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
        <div className={`p-6 lg:p-12 pb-32 animate-in fade-in ${mode === 'velvet' ? '' : 'bg-gray-50'}`}>
            <h2 className={`text-4xl font-bold uppercase tracking-[0.2em] mb-12 border-b pb-8 ${mode === 'velvet' ? 'text-white border-white/10' : 'text-gray-900 border-gray-200'}`}>{t('gallery.title')}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {videos.map((v: any) => (
                    <VideoCard
                        key={v.id}
                        type="video"
                        item={v}
                        isOwner={true}
                        onPublish={togglePublish}
                        onRemix={() => navigate('/app', { state: { remixPrompt: v.prompt } })}
                        publishing={publishing === v.id}
                        onDownload={(url) => {
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'video.mp4';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        }}
                    />
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
                    <button onClick={() => setAnnual(!annual)} className={`w-12 h-6 rounded-full relative p-1 transition-colors ${isVelvet ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}><div className={`w-4 h-4 rounded-full shadow-lg transition-transform duration-300 ${annual ? 'translate-x-6' : ''} ${isVelvet ? 'bg-[#C6A649]' : 'bg-white'}`}></div></button>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${annual ? (isVelvet ? 'text-[#C6A649]' : 'text-blue-600') : (isVelvet ? 'text-white/40' : 'text-gray-600')}`}>{t('billing.annual')} <span className={`${isVelvet ? 'bg-[#C6A649] text-black' : 'bg-blue-600 text-white'} px-2 py-0.5 rounded text-[8px] ml-1`}>{t('billing.discount')}</span></span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {Object.entries(PRICING_META).map(([k, p]) => {
                    const price = annual && (p as any).yearlyPrice ? (p as any).yearlyPrice : p.price;
                    const features = t(`pricing.${k}.features`, { returnObjects: true }) as string[];
                    return (
                        <div key={k} className={`p-10 rounded-[40px] text-center flex flex-col items-center relative overflow-hidden group hover:scale-105 transition-transform duration-500 ${isVelvet ? S.panel : 'bg-white border border-gray-200 shadow-xl'} ${p.popular ? (isVelvet ? 'border-[#C6A649]/50 shadow-[0_0_50px_rgba(198,166,73,0.15)]' : 'border-blue-500 shadow-lg scale-105') : ''}`}>
                            {p.popular && <div className={`absolute top-0 inset-x-0 h-1.5 ${isVelvet ? 'bg-gradient-to-r from-[#C6A649] to-[#FBF5B7]' : 'bg-blue-500'}`} />}
                            {p.popular && <div className={`${isVelvet ? 'bg-[#C6A649]/20 text-[#C6A649] border-[#C6A649]/30' : 'bg-blue-50 text-blue-600 border-blue-200'} text-[8px] font-bold px-4 py-1 rounded-full uppercase tracking-widest mb-6 border`}>{t('billing.recommended')}</div>}
                            <h3 className={`text-xl font-bold uppercase tracking-[0.2em] mb-2 ${isVelvet ? 'text-white' : 'text-black'}`}>{t(`pricing.${k}.name`)}</h3>
                            <div className={`text-3xl md:text-5xl font-bold mb-8 tracking-tighter ${isVelvet ? 'text-white' : 'text-black'}`}>${price}<span className={`text-sm font-normal ml-2 ${isVelvet ? 'text-white/30' : 'text-gray-600'}`}>/mo</span></div>
                            <div className={`w-full h-px mb-8 ${isVelvet ? 'bg-white/5' : 'bg-gray-100'}`}></div>
                            <div className="space-y-5 mb-10 w-full text-left">
                                <div className={`p-3 rounded-xl flex items-center justify-center gap-3 border mb-6 ${isVelvet ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}><Zap size={14} className={isVelvet ? 'text-[#C6A649]' : 'text-blue-500'} /><span className={`text-xs font-bold uppercase tracking-widest ${isVelvet ? 'text-white' : 'text-black'}`}>{t('studio.credits_cost', { cost: p.creds })}</span></div>
                                {features.map(f => <div key={f} className={`flex items-center gap-3 text-[10px] uppercase tracking-widest ${isVelvet ? 'text-white/60' : 'text-black'}`}><Check size={10} className={isVelvet ? 'text-[#C6A649]' : 'text-blue-500'} /> {f}</div>)}
                            </div>
                            <button onClick={() => onSelect(k, annual)} className={`w-full py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] ${p.popular ? (isVelvet ? S.btnGold : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg') : (isVelvet ? 'bg-white/5 text-white hover:bg-white hover:text-black transition-all' : 'bg-black text-white hover:bg-gray-800 transition-all')}`}>{t('billing.select_plan')}</button>
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
        if (user) {
            const { error } = await supabase.from('profiles').update({ instagram: data.instagram, telegram: data.telegram, phone: data.phone }).eq('id', user.id);
            if (error) { notify(t('settings.saved_error')); } else { notify(t('settings.saved_success')); }
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
                <div className="space-y-2"><label className={`text-[10px] uppercase tracking-widest ${isVelvet ? 'text-white/40' : 'text-gray-400'}`}>{t('settings.instagram')}</label><input value={data.instagram || ''} onChange={e => setData({ ...data, instagram: e.target.value })} className={isVelvet ? S.input : "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none transition-all focus:border-blue-500"} placeholder="@usuario" /></div>
                <div className="space-y-2"><label className={`text-[10px] uppercase tracking-widest ${isVelvet ? 'text-white/40' : 'text-gray-400'}`}>{t('settings.telegram')}</label><input value={data.telegram || ''} onChange={e => setData({ ...data, telegram: e.target.value })} className={isVelvet ? S.input : "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none transition-all focus:border-blue-500"} placeholder="@usuario" /></div>
                <div className="space-y-2"><label className={`text-[10px] uppercase tracking-widest ${isVelvet ? 'text-white/40' : 'text-gray-400'}`}>{t('settings.phone')}</label><input value={data.phone || ''} onChange={e => setData({ ...data, phone: e.target.value })} className={isVelvet ? S.input : "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none transition-all focus:border-blue-500"} placeholder="+123456789" /></div>
            </div>
            <button onClick={save} className={`w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs ${isVelvet ? S.btnGold : 'bg-black text-white hover:bg-gray-800'}`}>{t('common.save')}</button>
        </div>
    );
};

const StudioPage = ({ onGen, credits, notify, onUp, userPlan, talents, profile, modelId, onSelectModel }: any) => {
    const { mode } = useMode();
    const location = useLocation();
    const { t } = useTranslation();
    const [img, setImg] = useState<string | null>(null);
    const [prod, setProd] = useState<string | null>(null);
    const [vid, setVid] = useState<string | null>(null);
    const [type, setType] = useState<'img' | 'vid'>('img');
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
    const [resUrl, setResUrl] = useState<string | null>(null);
    const [modal, setModal] = useState(false);

    const init = useRef(false);
    const DEMO_IMG = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop";
    const DEMO_PROD = "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop";

    useEffect(() => {
        if (!init.current) {
            if (location.state?.remixPrompt) {
                setPrompt(location.state.remixPrompt);
                notify(t('studio.remix_loaded'));
            } else {
                setImg(DEMO_IMG); setProd(DEMO_PROD); setPrompt("Cinematic slow motion shot, elegant lighting, 8k resolution");
            }
            init.current = true;
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

    const handleFile = (e: any, setter: any) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = () => setter(r.result); r.readAsDataURL(f); } };

    const handlePromptInjection = (text: string) => { setPrompt(prev => prev + (prev ? ", " : "") + text); };

    const generate = async () => {
        if (!img && !vid) return;
        const cost = totalCost;
        if (!profile?.is_admin && credits < cost) { notify(t('studio.insufficient_credits')); onUp(); return; }
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
                voiceId: (voiceMode && voiceId) ? voiceId : undefined,
                modelId: modelId || undefined // VELVET BRIDGE
            };

            const r = await fetch(`${CONFIG.API_URL}/generate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                body: JSON.stringify(payload)
            });
            const d = await r.json();
            if (d.videoUrl) {
                setResUrl(d.videoUrl);
                // Use returned ID if available, fallback to timestamp only if null (though backend should return ID now)
                const realId = d.id || Date.now().toString();
                onGen({ url: d.videoUrl, cost, id: realId, date: new Date().toLocaleDateString(), prompt, aspectRatio: ratio });
                if (d.voiceWarning) notify(`Video generado (Voz falló: se cobraron ${cost - 20}cr)`);
                else notify(t('studio.generated_success'));
            } else throw new Error(d.error);
        } catch (e: any) { console.error(e); notify(t('auth.connection_error')); } finally { setLoading(false); }
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
            <div className="lg:col-span-5 flex justify-between items-end mb-4 border-b pb-6 border-white/10">
                <div>
                    <h2 className={`text-4xl font-bold uppercase tracking-[0.2em] ${mode === 'velvet' ? 'text-white' : 'text-gray-900'}`}>{t('studio.title')}</h2>
                    {mode === 'velvet' && <p className={S.subLuxe}>{t('studio.subtitle')}</p>}
                </div>
                <ModelSelector selectedModelId={modelId} onSelect={onSelectModel} />
            </div>
            {modal && <VelvetModal onClose={() => setModal(false)} onOk={() => { setModal(false); setVelvetFilter(true); notify(t('studio.velvet_active') + " 🔥"); }} />}
            <div className="lg:col-span-2 space-y-8">
                <div className="card-glass p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-heading flex gap-3">
                            <span className="text-primary">01</span> Reference Image
                            <Tooltip txt="Upload the photo you want to animate." />
                        </h2>
                        <div className="p-1.5 rounded-full border border-white/10 flex bg-black/40">
                            <button onClick={() => { setType('img'); setVid(null); }} className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase transition-all active:scale-95 duration-200 ${toggleClass(type === 'img')}`}>{t('studio.tabs.photo')}</button>
                            <button onClick={() => { setType('vid'); setImg(null); }} className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase transition-all active:scale-95 duration-200 ${toggleClass(type === 'vid')}`}>{t('studio.tabs.remix')}</button>
                        </div>
                    </div>
                    { }
                    <div className="grid grid-cols-2 gap-6">
                        <div id="studio-source-upload" className={`aspect-[3/4] rounded-[30px] border-2 border-dashed relative overflow-hidden group transition-all duration-300 ${type === 'vid' ? 'border-primary/30' : 'border-white/10 hover:border-primary/50'}`}>
                            {type === 'img' ? (img ? (<><img src={img} className="w-full h-full object-cover" />{img === DEMO_IMG && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-black text-[8px] font-bold px-3 py-1 rounded-full uppercase shadow-lg flex gap-2"><Sparkles size={10} /> {t('studio.upload.demo')}</div>}<button onClick={() => { setImg(null); }} className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white hover:bg-red-500 transition-all z-20"><X size={14} /></button></>) : <div className={`absolute inset-0 flex flex-col items-center justify-center text-white/20`}><Upload className="mb-4 w-8 h-8" /><span className="text-[9px] uppercase font-bold tracking-widest text-center">{t('studio.upload.subject')}</span><input type="file" onChange={e => handleFile(e, setImg)} className="absolute inset-0 opacity-0 cursor-pointer" /></div>) : (vid ? (<><video src={vid} className="w-full h-full object-cover opacity-50" controls preload="metadata" playsInline crossOrigin="anonymous" /><button onClick={() => setVid(null)} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-red-500 z-20"><X size={14} /></button></>) : <div className="absolute inset-0 flex flex-col items-center justify-center text-primary/40"><Film className="mb-4 w-8 h-8" /><span className="text-[9px] uppercase font-bold tracking-widest text-center">{t('studio.upload.video')}</span><input type="file" onChange={e => handleFile(e, setVid)} className="absolute inset-0 opacity-0 cursor-pointer" /></div>)}
                        </div>
                        <div className="flex flex-col gap-4">
                            <div id="studio-product-upload" className={`aspect-[3/4] rounded-[30px] border-2 border-dashed relative overflow-hidden group transition-all duration-300 border-white/10 bg-black/20 hover:border-primary/50`}>
                                {prod ? (<><img src={prod} className="w-full h-full object-cover" />{prod === DEMO_PROD && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-black text-[8px] font-bold px-3 py-1 rounded-full uppercase shadow-lg flex gap-2"><Sparkles size={10} /> {t('studio.upload.demo')}</div>}<button onClick={() => setProd(null)} className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white hover:bg-red-500 transition-all z-20"><X size={14} /></button></>) : <div className={`absolute inset-0 flex flex-col items-center justify-center text-white/20`}><Plus className="mb-4 w-8 h-8" /><span className="text-[9px] uppercase font-bold tracking-widest text-center">{t('studio.upload.product')}</span><input type="file" onChange={e => handleFile(e, setProd)} className="absolute inset-0 opacity-0 cursor-pointer" /></div>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card-glass p-8">
                    <div className="flex justify-between items-center mb-8"><h2 className="text-heading flex gap-3"><span className="text-primary">02</span> {t('studio.settings')}</h2>{mode === 'velvet' && (<div className="px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest flex items-center gap-2"><Flame size={12} /> {t('studio.velvet_active')}</div>)}</div>
                    { }
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        {CAMS.map(m => (<button key={m.id} onClick={() => setCam(m.id)} className={`relative p-4 rounded-3xl border flex flex-col items-center gap-3 transition-all group overflow-hidden active:scale-95 duration-200 ${cam === m.id ? 'bg-primary border-primary text-black shadow-lg' : 'bg-black/40 border-white/5 text-gray-500 hover:bg-white/5'}`}>{m.icon}<span className="text-[7px] font-bold uppercase tracking-widest">{t(`cams.${m.id}.label`)}</span></button>))}
                    </div>
                    { }
                    {mode === 'velvet' && (
                        <div className="grid grid-cols-4 gap-3 mb-6 animate-in fade-in slide-in-from-top-4">
                            {VELVET_STYLES.map(v => (<button key={v.id} onClick={() => { setVelvetStyle(v.id); handlePromptInjection(t(`velvet_styles.${v.id}.desc`)); }} className={`p-3 rounded-2xl border transition-all text-center group active:scale-95 duration-200 ${velvetStyle === v.id ? 'bg-primary/20 border-primary text-white' : 'bg-black/40 border-white/5 text-white/50'}`}><p className="text-[8px] font-bold uppercase tracking-widest mb-1">{t(`velvet_styles.${v.id}.name`)}</p></button>))}
                        </div>
                    )}
                    <div className="relative group"><textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={t('studio.prompt_placeholder')} className={`${inputClass} h-32 mb-8 resize-none p-6 text-sm border-white/10 focus:border-primary`} /><div className="absolute bottom-10 right-4"><Sparkles size={16} className={`text-primary opacity-50`} /></div></div>
                    { }
                    <div className={`grid grid-cols-2 gap-8 pt-6 border-t border-white/5`}>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest opacity-40">{t('studio.duration')}</span><span className={`font-bold text-xs text-primary`}>{dur}s</span></div>
                            <div className={`flex gap-2 p-1.5 rounded-2xl border bg-black/40 border-white/10`}><button onClick={() => setDur(5)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all active:scale-95 duration-200 ${toggleClass(dur === 5)}`}>5s (10cr)</button><button onClick={() => setDur(10)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all active:scale-95 duration-200 ${toggleClass(dur === 10)}`}>10s (20cr)</button></div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest opacity-40">{t('studio.ratio')}</span></div>
                            <div className={`flex gap-2 p-1.5 rounded-2xl border bg-black/40 border-white/10`}>{RATIOS.map(r => (<button key={r.id} onClick={() => setRatio(r.id)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all active:scale-95 duration-200 ${toggleClass(ratio === r.id)}`}>{t(r.labelKey)}</button>))}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 mb-12 px-6">
                <button
                    id="studio-generate-btn"
                    onClick={generate}
                    disabled={loading || (!img && !vid) || (!profile?.is_admin && credits < totalCost)}
                    className="btn-primary"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin" size={18} /> Creating magic...
                        </span>
                    ) : (
                        <span>Generate Video ({totalCost} CR)</span>
                    )}
                </button>
            </div>

            <div className="lg:col-span-3 relative z-10 flex flex-col pt-0 h-[calc(100vh-100px)] sticky top-8">
                <div className={`w-full h-full rounded-[40px] border overflow-hidden shadow-2xl relative transition-all duration-500 flex flex-col ${mode === 'velvet' ? 'bg-black border-white/10' : 'bg-white border-gray-200'}`}>
                    <div className={`flex-1 flex items-center justify-center p-8 transition-colors ${mode === 'velvet' ? 'bg-black/50' : 'bg-gray-50'}`}>
                        <div className={`relative w-full max-h-full transition-all duration-500 shadow-2xl ${ratio === '16:9' ? 'aspect-video w-full' : ratio === '1:1' ? 'aspect-square h-full' : 'aspect-[9/16] h-full'} ${mode === 'velvet' ? 'bg-black' : 'bg-black'}`}>
                            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20 pointer-events-none opacity-60"><div className="text-[10px] text-white font-mono flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> REC</div><div className="text-[10px] text-white font-mono">{dur}s • 4K</div></div>
                            {!resUrl && !loading && (<div className="absolute inset-0 flex flex-col items-center justify-center text-white/10 gap-6 border border-white/5"><div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center"><Video size={40} strokeWidth={1} /></div><span className="text-[9px] uppercase tracking-[0.4em] font-light">Preview</span></div>)}
                            {loading && (
                                <div className="absolute inset-0 bg-[#050505] z-30 flex flex-col items-center justify-center p-8 text-center">
                                    <div className={`w-20 h-20 border-t-2 border-r-2 rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(198,166,73,0.2)] ${mode === 'velvet' ? 'border-[#C6A649]' : 'border-black shadow-lg'}`}></div>
                                    <p className={`text-[10px] uppercase tracking-widest animate-pulse font-bold mb-4 ${mode === 'velvet' ? 'text-[#C6A649]' : 'text-black'}`}>{statusMsg}</p>
                                    <p className={`text-[9px] uppercase tracking-widest font-bold opacity-50 ${mode === 'velvet' ? 'text-white' : 'text-gray-600'}`}>Estimated time: {getEstimatedTime()}</p>
                                </div>
                            )}
                            {resUrl && <video src={resUrl} className="w-full h-full object-cover" controls preload="metadata" playsInline crossOrigin="anonymous" />}
                        </div>
                    </div>
                    <div className={`p-6 border-t flex justify-center backdrop-blur-sm transition-colors ${mode === 'velvet' ? 'border-white/5 bg-black/40' : 'border-gray-100 bg-white/40'}`}>
                        {resUrl ? (<a href={resUrl} download className={`px-12 py-4 rounded-full text-[10px] font-bold uppercase hover:scale-105 transition-transform flex gap-3 shadow-2xl items-center ${mode === 'velvet' ? 'bg-white text-black' : 'bg-black text-white'}`}><Download size={16} /> {t('studio.download')}</a>) : (<div className={`text-[9px] uppercase tracking-widest ${mode === 'velvet' ? 'text-white/30' : 'text-gray-400'}`}>{t('studio.ready')}</div>)}
                    </div>
                </div>
            </div>
        </div >
    );
};


// [REMOVED SENTINEL IMPORT]
// [REMOVED SENTINEL IMPORT]

// --- APP LAYOUT ---

function ProtectedLayout({ session, credits, handleLogout, setSelPlan, profile, mode, selPlan, notify }: any) {
    if (!session) return <Navigate to="/login" replace />;
    return (
        <div className={`${mode === 'velvet' ? S.bg : 'bg-gray-50 min-h-screen text-gray-900 font-sans'}`}>
            {selPlan && <CheckoutModal planKey={selPlan.key} annual={selPlan.annual} onClose={() => setSelPlan(null)} />}

            { }
            <div className="hidden lg:block">
                <Sidebar credits={credits} onLogout={handleLogout} onUp={() => setSelPlan({ key: 'creator', annual: true })} userProfile={profile} onUpgrade={() => setSelPlan({ key: 'creator', annual: true })} notify={notify} />
                <main className="ml-80 min-h-screen pt-0 transition-colors duration-500"><Outlet /></main>
            </div>

            { }
            <div className="lg:hidden">
                <MobileLayout>
                    <MobileHeader credits={credits} userProfile={profile} onUpgrade={() => setSelPlan({ key: 'creator', annual: true })} />
                    <Outlet />
                </MobileLayout>
            </div>
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
    const [selPlan, setSelPlan] = useState<{ key: string, annual: boolean } | null>(null);
    const [profile, setProfile] = useState<UserProfile>({ name: "User", email: "", plan: 'starter' });
    const [modelId, setModelId] = useState<string | null>(null); // ENGINE STATE
    const { mode, setMode } = useMode();
    const { showToast } = useToast();
    const notify = (msg: string) => showToast(msg);

    const handleInf = {
        add: async (inf: any) => {
            const user = session?.user;
            if (!user) return;
            const tempId = `temp_${Date.now()}`;
            // Optimistic UI Update
            const newTalent = { ...inf, id: tempId, user_id: user.id };
            setInfluencers([newTalent, ...influencers]);

            try {
                const { data: { session } } = await supabase.auth.getSession();

                const payload = {
                    name: inf.name,
                    image_url: typeof inf.image_url === 'string' ? inf.image_url : '',
                    role: inf.role || 'model',
                    dna_prompt: inf.dna_prompt || '',
                    for_sale: inf.for_sale || false,
                    price: inf.price || 0,
                    source_video_id: inf.source_video_id // PASS THE SOURCE ID
                };

                const res = await fetch(`${CONFIG.API_URL}/talents/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`
                    },
                    body: JSON.stringify(payload)
                });

                const result = await res.json();

                if (!result.success) {
                    throw new Error(result.error || "Failed to create talent");
                }

                const data = result.talent;
                setInfluencers(prev => prev.map(i => i.id === tempId ? data : i));
                notify(t('talent.created_success'));

            } catch (error: any) {
                console.error("Error adding talent:", error);
                notify(error.message || "Error adding talent");
                // Revert optimistic update
                setInfluencers(prev => prev.filter(i => i.id !== tempId));
            }
        },
        del: async (id: string) => {
            const old = [...influencers];
            setInfluencers(prev => prev.filter(i => i.id !== id));
            const { error } = await supabase.from('talents').delete().eq('id', id);
            if (error) { console.error("Error deleting talent:", error); notify("Error deleting"); setInfluencers(old); }
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

                // --- WHITELIST GUARD ---
                // If status is pending (default) and NOT admin, redirect.
                // We use window.location because we are outside a component with easy navigate access or to ensure hard redirect.
                // Actually, strict check: if access_status is explicitly 'pending'.
                // Admin is ALWAYS approved.
                const isApproved = data.access_status === 'approved' || data.is_admin;
                const isPending = data.access_status === 'pending' || !data.access_status; // Default pending if null

                if (!isApproved && window.location.pathname.startsWith('/app')) {
                    // Redirect to pending page if trying to access app
                    window.location.href = '/';
                    return;
                }
            } else {
                // Fallback for email if profile fetch fails or if email is not in profile
                setProfile(prev => ({ ...prev, email: user.email || "" }));
            }

            // Load talents
            const { data: tal } = await supabase.from('talents').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
            if (tal) setInfluencers(tal);

            // Load generations
            const { data: gens } = await supabase.from('generations').select('*, is_sold').eq('user_id', user.id).order('created_at', { ascending: false });
            if (gens) setVideos(gens);

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

    if (loading) return <div className="min-h-screen bg-[#030303] flex items-center justify-center"><Loader2 className="w-12 h-12 text-[#C6A649] animate-spin" /></div>;

    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingWaitlist />} />
                {/* <Route path="/access-pending" element={<AccessPending />} /> */}
                <Route path="/activate-account" element={<ActivateAccount />} />
                <Route path="/login" element={!session ? <LoginScreen onLogin={() => { }} /> : <Navigate to="/app" />} />
                <Route path="/register" element={!session ? <LoginScreen onLogin={() => { }} /> : <Navigate to="/app" />} />
                <Route path="/app" element={
                    // GOLDEN GATE PROTECTION
                    // If session exists, check status:
                    // - PENDING -> Waitlist (or Pending Page, but we deleted it? No, user said delete AccessPending. so Redirect to / #waitlist or show a simple error?)
                    // - APPROVED -> Needs activation? (If handled by LoginScreen, good. If session is valid, they are usually active or approved.)
                    // - ACTIVE -> Allow.

                    // Logic: If session && (status === 'APPROVED' || status === 'ACTIVE' || profile.is_admin) -> Allow.
                    // If session && status === 'PENDING' -> Redirect to / with alert? Or Logout?

                    session && (profile?.status === 'APPROVED' || profile?.status === 'ACTIVE' || profile?.is_admin)
                        ? <ProtectedLayout session={session} credits={credits} handleLogout={handleLogout} setSelPlan={setSelPlan} profile={profile} mode={mode} selPlan={selPlan} notify={notify} />
                        : (session ? <Navigate to="/" replace /> : <Navigate to="/login" replace />)
                }>
                    <Route index element={<StudioPage onGen={handleVideoSaved} influencers={influencers} credits={credits} notify={notify} onUp={() => setSelPlan({ key: 'creator', annual: true })} userPlan={userPlan} talents={influencers} profile={profile} modelId={modelId} onSelectModel={setModelId} />} />
                    <Route path="studio" element={<StudioConsole credits={credits} setCredits={setCredits} notify={notify} />} />
                    <Route path="explore" element={<ExplorePage />} />
                    <Route path="gallery" element={<GalleryPage videos={videos} setVideos={setVideos} />} />
                    <Route path="billing" element={<BillingPage onSelect={(k: string, a: boolean) => setSelPlan({ key: k, annual: a })} />} />
                    <Route path="settings" element={<SettingsPage credits={credits} profile={profile} setProfile={handleUpdateProfile} notify={notify} />} />
                    <Route path="earnings" element={<EarningsDashboard />} />
                    <Route path="*" element={<Navigate to="/app" replace />} />
                </Route>
// [REMOVED SENTINEL IMPORT]
// [REMOVED SENTINEL IMPORT]
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router >
    );
}

function App() {
    return (
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    );
}

export default App;
