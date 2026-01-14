import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Sparkles, Film, Plus, Zap, Lock, Video, Download, Flame, Move, ZoomIn, Heart, Smartphone, Monitor, Square, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { S } from '../styles';
import { CONFIG } from '../config';
import { Tooltip } from '../components/Tooltip';
import { VelvetModal } from '../components/VelvetModal';
import { Talent, UserProfile } from '../types';
import { useMode } from '../context/ModeContext';
import { useTranslation } from 'react-i18next';
import { StudioOnboarding } from '../components/StudioOnboarding';

// --- CONSTANTS ---
const DEMO_IMG = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop";
const DEMO_PROD = "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop";
const DEMO_TXT = "Cinematic slow motion shot, elegant lighting, 8k resolution";

// CAMS & RATIOS Moved to component or using t() dynamically
// But since they are constants, we can't use hook here.
// We will move them inside component or use translation keys.
// For now, I will map them inside the component render.

const RATIOS = [
  { id: '9:16', label: 'ratios.stories', icon: <Smartphone size={14}/> },
  { id: '16:9', label: 'ratios.cinema', icon: <Monitor size={14}/> },
  { id: '1:1', label: 'ratios.square', icon: <Square size={14}/> }
];

const VELVET_STYLES = [
  { id: 'leaked', name: 'Leaked Tape', desc: 'Raw & Amateur' },
  { id: 'boudoir', name: 'Glamour', desc: 'Cinematic & Spicy' },
  { id: 'cosplay', name: 'Cosplay', desc: 'Anime Realism' },
];

interface StudioPageProps {
    onGen: (videoData: any) => void;
    credits: number;
    notify: (msg: string) => void;
    onUp: () => void;
    userPlan: string;
    talents: Talent[];
    profile?: UserProfile;
}

export const StudioPage = ({ onGen, credits, notify, onUp, userPlan, talents, profile }: StudioPageProps) => {
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
  // Velvet state logic: if global mode is velvet, we default to showing velvet features?
  // Or we keep the toggle inside the studio? Let's respect global mode as the "Theme" and the velvet toggle as the "Content Filter".
  // Actually, the prompt says Velvet Mode is for Model Managers. So if ModeContext is Velvet, the UI should be optimized for that.
  const [velvetFilter, setVelvetFilter] = useState(false);
  const [velvetStyle, setVelvetStyle] = useState('leaked');
  const [loading, setLoading] = useState(false);
  const [resUrl, setResUrl] = useState<string|null>(null);
  const [modal, setModal] = useState(false);

  const init = useRef(false);
  useEffect(() => {
      if(!init.current) {
          setImg(DEMO_IMG);
          setProd(DEMO_PROD);
          setPrompt(DEMO_TXT);
          init.current=true;
      }
      // Strict Mode Separation Logic
      if (mode === 'velvet') {
        // In Velvet Mode, enforce the filter
        setVelvetFilter(true);
      } else {
        // In Agency Mode, ensure filter is off
        setVelvetFilter(false);
      }
  }, [mode]);

  const handleFile = (e:any, setter:any) => { const f = e.target.files[0]; if(f) { const r=new FileReader(); r.onload=()=>setter(r.result); r.readAsDataURL(f); } };

  // Manual toggle removed for Agency mode to enforce strict separation
  // For Velvet mode, it's always on.

  const calculateCost = () => {
    let base = dur === 5 ? 10 : 20;
    // Cost always includes +10 if in Velvet Mode or filter is active (redundant check but safe)
    if (mode === 'velvet' || velvetFilter) base += 10;
    return base;
  };

  const handlePromptInjection = (text: string) => { setPrompt(prev => prev + (prev ? ", " : "") + text); };

  const generate = async () => {
      if(!img && !vid) return;
      const cost = calculateCost();
      // Admin bypass cost check locally (backend also checks)
      if(!profile?.is_admin && credits < cost) { notify("Faltan Créditos"); onUp(); return; }

      setLoading(true); setResUrl(null);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          // Force mode 'velvet' if global mode is velvet, regardless of local state glitches
          // Force mode 'standard' if global mode is agency
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

  // Dynamic Styles based on Mode
  const panelClass = mode === 'velvet'
    ? `bg-[#0a0a0a]/90 border-white/5 shadow-2xl hover:border-[#C6A649]/20 text-white`
    : `bg-white border-gray-200 shadow-xl text-gray-900`;

  const inputClass = mode === 'velvet'
    ? S.input
    : "bg-gray-50 border border-gray-200 text-gray-900 p-4 rounded-xl focus:border-blue-500 outline-none transition-all text-xs w-full placeholder:text-gray-400";

  const toggleClass = (isActive: boolean) => {
    if (mode === 'velvet') {
        return isActive ? S.activeTab : 'bg-black/40 text-gray-400 border border-white/10 hover:text-white hover:bg-white/5';
    }
    return isActive ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-500 hover:text-black border border-gray-200 shadow-sm';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 p-6 lg:p-12 pb-32 lg:pb-12 animate-in fade-in duration-700 mb-24 lg:mb-0 relative">
      <StudioOnboarding />
      {modal && <VelvetModal onClose={()=>setModal(false)} onOk={()=>{setModal(false); setVelvetFilter(true); notify("Modo Velvet Activado 🔥");}}/>}

      {/* LEFT & CENTER: INPUTS & SETTINGS */}
      <div className="lg:col-span-2 space-y-6">

        {/* PANEL 1: SOURCE */}
        <div className={`p-8 rounded-[40px] border transition-all duration-300 ${panelClass}`}>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] flex gap-3"><span className={mode==='velvet'?"text-[#C6A649]":"text-blue-600"}>01</span> {t('studio.source')} <Tooltip txt="Base asset"/></h2>
                <div className={`p-1.5 rounded-full border flex ${mode==='velvet'?'bg-black/40 border-white/10':'bg-gray-100 border-gray-200'}`}>
                    <button onClick={()=>{setType('img'); setVid(null);}} className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase transition-all ${toggleClass(type==='img')}`}>{t('studio.tabs.photo')}</button>
                    <button onClick={()=>{setType('vid'); setImg(null);}} className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase transition-all ${toggleClass(type==='vid')}`}>{t('studio.tabs.remix')}</button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* MAIN UPLOAD */}
                <div id="studio-source-upload" className={`aspect-[3/4] rounded-[30px] border-2 border-dashed relative overflow-hidden group transition-all duration-300 ${type==='vid'?'border-blue-500/30':(mode==='velvet'?'border-white/10 hover:border-[#C6A649]/50':'border-gray-200 hover:border-blue-500')}`}>
                    {type==='img' ? ( img ? (<><img src={img} className="w-full h-full object-cover"/>{img===DEMO_IMG && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#C6A649] text-black text-[8px] font-bold px-3 py-1 rounded-full uppercase shadow-lg flex gap-2"><Sparkles size={10}/> {t('studio.upload.demo')}</div>}<button onClick={()=>{setImg(null);}} className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white hover:bg-red-500 transition-all z-20"><X size={14}/></button></>) : <div className={`absolute inset-0 flex flex-col items-center justify-center ${mode==='velvet'?'text-white/20':'text-gray-400'}`}><Upload className="mb-4 w-8 h-8"/><span className="text-[9px] uppercase font-bold tracking-widest text-center">{t('studio.upload.subject')}</span><input type="file" onChange={e=>handleFile(e, setImg)} className="absolute inset-0 opacity-0 cursor-pointer"/></div> ) : ( vid ? (<><video src={vid} autoPlay loop muted className="w-full h-full object-cover opacity-50"/><button onClick={()=>setVid(null)} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-red-500 z-20"><X size={14}/></button></>) : <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-500/40"><Film className="mb-4 w-8 h-8"/><span className="text-[9px] uppercase font-bold tracking-widest text-center">{t('studio.upload.video')}</span><input type="file" onChange={e=>handleFile(e, setVid)} className="absolute inset-0 opacity-0 cursor-pointer"/></div> )}
                </div>

                {/* SECONDARY UPLOAD / TALENTS */}
                <div className="flex flex-col gap-4">
                     <div id="studio-product-upload" className={`aspect-[3/4] rounded-[30px] border-2 border-dashed relative overflow-hidden group transition-all duration-300 ${mode==='velvet'?'border-white/10 bg-black/20 hover:border-[#C6A649]/50':'border-gray-200 bg-gray-50 hover:border-blue-500'}`}>
                        {prod ? (<><img src={prod} className="w-full h-full object-cover"/>{prod===DEMO_PROD && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#C6A649] text-black text-[8px] font-bold px-3 py-1 rounded-full uppercase shadow-lg flex gap-2"><Sparkles size={10}/> {t('studio.upload.demo')}</div>}<button onClick={()=>setProd(null)} className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white hover:bg-red-500 transition-all z-20"><X size={14}/></button></>) : <div className={`absolute inset-0 flex flex-col items-center justify-center ${mode==='velvet'?'text-white/20':'text-gray-400'}`}><Plus className="mb-4 w-8 h-8"/><span className="text-[9px] uppercase font-bold tracking-widest text-center">{t('studio.upload.product')}</span><input type="file" onChange={e=>handleFile(e, setProd)} className="absolute inset-0 opacity-0 cursor-pointer"/></div>}
                     </div>
                </div>
            </div>

            {/* QUICK CAST (AVATARS) - Elegant Horizontal Carousel */}
            {talents && talents.length > 0 && (
                <div className={`mt-6 rounded-3xl p-6 border transition-all ${mode==='velvet'?'bg-black/40 border-white/10':'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <p className="text-[9px] opacity-50 uppercase tracking-widest flex items-center gap-2"><Sparkles size={10}/> {t('studio.quick_cast')}</p>
                    </div>

                    <div className="overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                        <div className="flex gap-4">
                            {talents.map((t:Talent) => (
                                <button
                                    key={t.id}
                                    onClick={()=>{
                                        setImg(t.image_url);
                                        if (t.notes) handlePromptInjection(t.notes);
                                    }}
                                    className="group relative flex-shrink-0 w-20 flex flex-col items-center gap-2"
                                >
                                    <div className={`w-20 h-20 rounded-full overflow-hidden border-2 transition-all duration-300 p-0.5
                                        ${img === t.image_url
                                            ? (mode==='velvet' ? 'border-[#C6A649] shadow-[0_0_20px_rgba(198,166,73,0.3)] scale-105' : 'border-black shadow-lg scale-105')
                                            : (mode==='velvet' ? 'border-white/10 opacity-70 group-hover:opacity-100 group-hover:border-white/30' : 'border-gray-200 opacity-80 group-hover:opacity-100 group-hover:border-gray-300')
                                        }`}
                                    >
                                        <div className="w-full h-full rounded-full overflow-hidden relative">
                                            <img src={t.image_url} className="w-full h-full object-cover"/>
                                            {img === t.image_url && (
                                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center animate-in fade-in zoom-in">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${mode==='velvet'?'bg-[#C6A649] text-black':'bg-black text-white'}`}>
                                                        <Check size={12} strokeWidth={4}/>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p className={`text-[9px] font-bold uppercase truncate max-w-full text-center tracking-wider ${mode==='velvet' ? (img===t.image_url?'text-[#C6A649]':'text-gray-500') : (img===t.image_url?'text-black':'text-gray-500')}`}>
                                        {t.name}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* PANEL 2: SETTINGS */}
        <div className={`p-8 rounded-[40px] border transition-all duration-300 ${panelClass}`}>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] flex gap-3"><span className={mode==='velvet'?"text-[#C6A649]":"text-blue-600"}>02</span> {t('studio.settings')}</h2>
                {/* VELVET FILTER TOGGLE IS HIDDEN IN AGENCY MODE */}
                {mode === 'velvet' && (
                    <div className="px-4 py-1.5 rounded-full border border-[#C6A649]/30 bg-[#C6A649]/10 text-[#C6A649] text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <Flame size={12}/> Velvet Mode Active
                    </div>
                )}
            </div>

            {/* CAMERA CONTROLS */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {[{ id: 'static', label: t('cams.static.label'), icon: <Move size={18}/>}, { id: 'zoom', label: t('cams.zoom.label'), icon: <ZoomIn size={18}/>}, { id: 'eye', label: t('cams.eye.label'), icon: <Heart size={18}/>}, { id: 'hand', label: t('cams.hand.label'), icon: <Video size={18}/>}].map(m => (
                    <button key={m.id} onClick={()=>setCam(m.id)} className={`relative p-4 rounded-3xl border flex flex-col items-center gap-3 transition-all group overflow-hidden
                        ${cam===m.id
                            ? (mode==='velvet' ? 'bg-[#C6A649] border-[#C6A649] text-black shadow-lg' : 'bg-black border-black text-white shadow-lg')
                            : (mode==='velvet' ? 'bg-black/40 border-white/5 text-gray-500 hover:bg-white/5' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-white hover:border-gray-300')
                        }`}>
                        {m.icon}<span className="text-[7px] font-bold uppercase tracking-widest">{m.label}</span>
                    </button>
                ))}
            </div>

            {/* VELVET STYLES (Only if Active, which depends on MODE now) */}
            {mode === 'velvet' && (
                <div className="grid grid-cols-4 gap-3 mb-6 animate-in fade-in slide-in-from-top-4">
                    {VELVET_STYLES.map(v => (
                        <button key={v.name} onClick={()=>{setVelvetStyle(v.id); handlePromptInjection(v.desc);}} className={`p-3 rounded-2xl border transition-all text-center group
                            ${velvetStyle===v.id
                                ? (mode==='velvet' ? 'bg-pink-500/10 border-pink-500 text-white' : 'bg-purple-100 border-purple-500 text-purple-900')
                                : (mode==='velvet' ? 'bg-black/40 border-white/5 text-white/50' : 'bg-white border-gray-200 text-gray-400')}`}>
                            <p className="text-[8px] font-bold uppercase tracking-widest mb-1">{v.name}</p>
                        </button>
                    ))}
                </div>
            )}

            {/* PROMPT */}
            <div className="relative group">
                <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder={t('studio.prompt_placeholder')} className={`${inputClass} h-32 mb-8 resize-none p-6 text-sm ${mode==='velvet' ? 'border-pink-900/50 focus:border-pink-500' : ''}`}/>
                <div className="absolute bottom-10 right-4"><Sparkles size={16} className={`${mode==='velvet'?'text-[#C6A649]':'text-blue-500'} opacity-50`}/></div>
            </div>

            {/* DURATION & RATIO */}
            <div className={`grid grid-cols-2 gap-8 pt-6 border-t ${mode==='velvet'?'border-white/5':'border-gray-100'}`}>
                <div className="space-y-4">
                    <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest opacity-40">{t('studio.duration')}</span><span className={`font-bold text-xs ${mode==='velvet'?'text-[#C6A649]':'text-blue-600'}`}>{dur}s</span></div>
                    <div className={`flex gap-2 p-1.5 rounded-2xl border ${mode==='velvet'?'bg-black/40 border-white/10':'bg-gray-100 border-gray-200'}`}>
                        <button onClick={()=>setDur(5)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${toggleClass(dur===5)}`}>5s (10cr)</button>
                        <button onClick={()=>setDur(10)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${toggleClass(dur===10)}`}>10s (20cr)</button>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest opacity-40">{t('studio.ratio')}</span></div>
                    <div className={`flex gap-2 p-1.5 rounded-2xl border ${mode==='velvet'?'bg-black/40 border-white/10':'bg-gray-100 border-gray-200'}`}>
                        {RATIOS.map(r => (
                            <button key={r.id} onClick={() => setRatio(r.id)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${toggleClass(ratio === r.id)}`}>{t(r.label)}</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* ACTION BUTTON */}
        <button id="studio-generate-btn" onClick={generate} disabled={loading || (!img && !vid)} className={`w-full py-7 rounded-[32px] font-bold uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 fixed bottom-24 lg:bottom-auto left-4 right-4 lg:static lg:w-full z-50 shadow-2xl transition-all duration-300
            ${mode==='velvet'
                ? (velvetFilter ? S.btnVelvet : S.btnGold)
                : 'bg-black text-white shadow-lg hover:bg-gray-800 hover:shadow-xl active:scale-95'
            }`}>
            {loading ? t('studio.processing') : <><Zap size={18}/> {t('studio.generate')} ({calculateCost()})</>}
        </button>
      </div>

      {/* RIGHT PANEL: PREVIEW */}
      <div className="lg:col-span-3 relative z-10 flex flex-col pt-0 h-[calc(100vh-100px)] sticky top-8">
         <div className={`w-full h-full rounded-[40px] border overflow-hidden shadow-2xl relative transition-all duration-500 flex flex-col
            ${mode==='velvet' ? 'bg-black border-white/10' : 'bg-white border-gray-200'}
         `}>
            {/* Aspect Ratio Container within the fixed panel - centered */}
            <div className={`flex-1 flex items-center justify-center p-8 transition-colors ${mode==='velvet' ? 'bg-black/50' : 'bg-gray-50'}`}>
                 <div className={`relative w-full max-h-full transition-all duration-500 shadow-2xl
                    ${ratio==='16:9'?'aspect-video w-full':ratio==='1:1'?'aspect-square h-full':'aspect-[9/16] h-full'}
                    ${mode==='velvet' ? 'bg-black' : 'bg-black'}
                 `}>
                    <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20 pointer-events-none opacity-60"><div className="text-[10px] text-white font-mono flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> REC</div><div className="text-[10px] text-white font-mono">{dur}s • 4K</div></div>

                    {!resUrl && !loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10 gap-6 border border-white/5">
                            <div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center"><Video size={40} strokeWidth={1}/></div>
                            <span className="text-[9px] uppercase tracking-[0.4em] font-light">{t('studio.preview')}</span>
                        </div>
                    )}

                    {loading && (
                        <div className="absolute inset-0 bg-[#050505] z-30 flex flex-col items-center justify-center">
                            <div className={`w-20 h-20 border-t-2 border-r-2 rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(198,166,73,0.2)]
                                ${mode==='velvet' ? 'border-[#C6A649]' : 'border-black shadow-lg'}
                            `}></div>
                            <p className={`text-[10px] uppercase tracking-widest animate-pulse font-bold ${mode==='velvet'?'text-[#C6A649]':'text-black'}`}>{t('studio.processing')}</p>
                        </div>
                    )}

                    {resUrl && <video src={resUrl} controls autoPlay loop className="w-full h-full object-cover"/>}
                 </div>
            </div>

            {/* Footer Actions inside the fixed panel */}
            <div className={`p-6 border-t flex justify-center backdrop-blur-sm transition-colors ${mode==='velvet'?'border-white/5 bg-black/40':'border-gray-100 bg-white/40'}`}>
                {resUrl ? (
                    <a href={resUrl} download className={`px-12 py-4 rounded-full text-[10px] font-bold uppercase hover:scale-105 transition-transform flex gap-3 shadow-2xl items-center
                        ${mode==='velvet' ? 'bg-white text-black' : 'bg-black text-white'}
                    `}><Download size={16}/> {t('studio.download')}</a>
                ) : (
                    <div className={`text-[9px] uppercase tracking-widest ${mode==='velvet'?'text-white/30':'text-gray-400'}`}>{t('studio.ready_render')}</div>
                )}
            </div>
         </div>
      </div>
    </div>
  );
};
