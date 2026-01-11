import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Sparkles, Film, Plus, Zap, Lock, Video, Download, Flame, Move, ZoomIn, Heart, Smartphone, Monitor, Square } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { S } from '../styles';
import { CONFIG } from '../config';
import { Tooltip } from '../components/Tooltip';
import { VelvetModal } from '../components/VelvetModal';
import { Talent } from '../types';
import { useMode } from '../context/ModeContext';
import { useTranslation } from 'react-i18next';

// --- CONSTANTS ---
const DEMO_IMG = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop";
const DEMO_PROD = "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop";
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

export const StudioPage = ({ onGen, credits, notify, onUp, userPlan, talents }: any) => {
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
  const [velvetStyle, setVelvetStyle] = useState('glam');
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
      // Auto-enable velvet filter if in Velvet Mode context
      if (mode === 'velvet') setVelvetFilter(true);
      else setVelvetFilter(false);
  }, [mode]);

  const handleFile = (e:any, setter:any) => { const f = e.target.files[0]; if(f) { const r=new FileReader(); r.onload=()=>setter(r.result); r.readAsDataURL(f); } };

  const toggleVelvetFilter = () => {
      if(userPlan==='starter') setModal(true);
      else { setVelvetFilter(!velvetFilter); notify(velvetFilter ? "Standard Filter" : "Velvet Filter Active"); }
  };

  const calculateCost = () => { let base = dur === 5 ? 10 : 20; if (velvetFilter) base += 10; return base; };
  const handlePromptInjection = (text: string) => { setPrompt(prev => prev + (prev ? ", " : "") + text); };

  const generate = async () => {
      if(!img && !vid) return;
      const cost = calculateCost();
      if(credits < cost) { notify("Faltan Créditos"); onUp(); return; }
      setLoading(true); setResUrl(null);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          const r = await fetch(`${CONFIG.API_URL}/generate`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
              body: JSON.stringify({ image: img, endImage: prod, inputVideo: vid, prompt, duration: dur, aspectRatio: ratio, mode: velvetFilter?'velvet':'standard', velvetStyle: velvetFilter?velvetStyle:null })
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-12 pb-32 animate-in fade-in duration-700">
      {modal && <VelvetModal onClose={()=>setModal(false)} onOk={()=>{setModal(false); setVelvetFilter(true); notify("Modo Velvet Activado 🔥");}}/>}

      {/* LEFT & CENTER: INPUTS & SETTINGS */}
      <div className="lg:col-span-7 space-y-6">

        {/* PANEL 1: SOURCE */}
        <div className={`p-8 rounded-[40px] border transition-all duration-300 ${panelClass}`}>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] flex gap-3"><span className={mode==='velvet'?"text-[#C6A649]":"text-blue-600"}>01</span> {t('studio.source')} <Tooltip txt="Base asset"/></h2>
                <div className={`p-1.5 rounded-full border flex ${mode==='velvet'?'bg-black/40 border-white/10':'bg-gray-100 border-gray-200'}`}>
                    <button onClick={()=>{setType('img'); setVid(null);}} className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase transition-all ${type==='img' ? (mode==='velvet'?S.activeTab:'bg-white shadow text-black') : 'text-gray-400'}`}>Photo</button>
                    <button onClick={()=>{setType('vid'); setImg(null);}} className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase transition-all ${type==='vid' ? (mode==='velvet'?S.activeTab:'bg-white shadow text-black') : 'text-gray-400'}`}>Remix</button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* MAIN UPLOAD */}
                <div className={`aspect-[3/4] rounded-[30px] border-2 border-dashed relative overflow-hidden group transition-all duration-300 ${type==='vid'?'border-blue-500/30':(mode==='velvet'?'border-white/10 hover:border-[#C6A649]/50':'border-gray-200 hover:border-blue-500')}`}>
                    {type==='img' ? ( img ? (<><img src={img} className="w-full h-full object-cover"/>{img===DEMO_IMG && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#C6A649] text-black text-[8px] font-bold px-3 py-1 rounded-full uppercase shadow-lg flex gap-2"><Sparkles size={10}/> Demo</div>}<button onClick={()=>{setImg(null);}} className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white hover:bg-red-500 transition-all z-20"><X size={14}/></button></>) : <div className={`absolute inset-0 flex flex-col items-center justify-center ${mode==='velvet'?'text-white/20':'text-gray-400'}`}><Upload className="mb-4 w-8 h-8"/><span className="text-[9px] uppercase font-bold tracking-widest">Upload</span><input type="file" onChange={e=>handleFile(e, setImg)} className="absolute inset-0 opacity-0 cursor-pointer"/></div> ) : ( vid ? (<><video src={vid} autoPlay loop muted className="w-full h-full object-cover opacity-50"/><button onClick={()=>setVid(null)} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-red-500 z-20"><X size={14}/></button></>) : <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-500/40"><Film className="mb-4 w-8 h-8"/><span className="text-[9px] uppercase font-bold tracking-widest">Upload Video</span><input type="file" onChange={e=>handleFile(e, setVid)} className="absolute inset-0 opacity-0 cursor-pointer"/></div> )}
                </div>

                {/* SECONDARY UPLOAD / TALENTS */}
                <div className="flex flex-col gap-4">
                     <div className={`aspect-[3/4] rounded-[30px] border-2 border-dashed relative overflow-hidden group transition-all duration-300 ${mode==='velvet'?'border-white/10 bg-black/20 hover:border-[#C6A649]/50':'border-gray-200 bg-gray-50 hover:border-blue-500'}`}>
                        {prod ? (<><img src={prod} className="w-full h-full object-cover"/>{prod===DEMO_PROD && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#C6A649] text-black text-[8px] font-bold px-3 py-1 rounded-full uppercase shadow-lg flex gap-2"><Sparkles size={10}/> Demo</div>}<button onClick={()=>setProd(null)} className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white hover:bg-red-500 transition-all z-20"><X size={14}/></button></>) : <div className={`absolute inset-0 flex flex-col items-center justify-center ${mode==='velvet'?'text-white/20':'text-gray-400'}`}><Plus className="mb-4 w-8 h-8"/><span className="text-[9px] uppercase font-bold tracking-widest">Target / Ref</span><input type="file" onChange={e=>handleFile(e, setProd)} className="absolute inset-0 opacity-0 cursor-pointer"/></div>}
                     </div>

                     {/* TALENT SELECTOR */}
                     {talents && talents.length > 0 && (
                        <div className={`rounded-2xl p-2 max-h-32 overflow-y-auto border ${mode==='velvet'?'bg-black/40 border-white/10':'bg-gray-100 border-gray-200'}`}>
                            <p className="text-[9px] opacity-50 uppercase tracking-widest mb-2 pl-2">Quick Cast</p>
                            <div className="grid grid-cols-3 gap-2">
                                {talents.map((t:Talent) => (
                                    <button key={t.id} onClick={()=>setImg(t.image_url)} className={`relative aspect-square rounded-xl overflow-hidden border transition-all group ${mode==='velvet'?'border-white/10 hover:border-[#C6A649]':'border-gray-300 hover:border-blue-500'}`}>
                                        <img src={t.image_url} className="w-full h-full object-cover"/>
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"><Plus size={12}/></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                     )}
                </div>
            </div>
        </div>

        {/* PANEL 2: SETTINGS */}
        <div className={`p-8 rounded-[40px] border transition-all duration-300 ${panelClass}`}>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] flex gap-3"><span className={mode==='velvet'?"text-[#C6A649]":"text-blue-600"}>02</span> {t('studio.settings')}</h2>
                <button onClick={toggleVelvetFilter} className={`px-6 py-2.5 rounded-full border text-[9px] font-bold uppercase flex items-center gap-3 transition-all
                    ${velvetFilter
                        ? (mode==='velvet' ? 'border-pink-500 text-white bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.3)]' : 'border-purple-600 text-purple-700 bg-purple-50')
                        : 'border-white/10 text-gray-400 hover:border-white/30'}`}>
                    {velvetFilter ? <Flame size={14} className={mode==='velvet'?"text-pink-500 animate-pulse":"text-purple-600"}/> : <Flame size={14}/>} Velvet Filter {userPlan==='starter' && <Lock size={10} className="ml-1 opacity-50"/>}
                </button>
            </div>

            {/* CAMERA CONTROLS */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {CAMS.map(m => (
                    <button key={m.id} onClick={()=>setCam(m.id)} className={`relative p-4 rounded-3xl border flex flex-col items-center gap-3 transition-all group overflow-hidden
                        ${cam===m.id
                            ? (mode==='velvet' ? 'bg-[#C6A649] border-[#C6A649] text-black shadow-lg' : 'bg-blue-600 border-blue-600 text-white shadow-lg')
                            : (mode==='velvet' ? 'bg-black/40 border-white/5 text-gray-500 hover:bg-white/5' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-white hover:border-blue-200')
                        }`}>
                        {m.icon}<span className="text-[7px] font-bold uppercase tracking-widest">{m.label}</span>
                    </button>
                ))}
            </div>

            {/* VELVET STYLES (Only if Active) */}
            {velvetFilter && (
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
                <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe your vision..." className={`${inputClass} h-32 mb-8 resize-none p-6 text-sm ${velvetFilter && mode==='velvet' ? 'border-pink-900/50 focus:border-pink-500' : ''}`}/>
                <div className="absolute bottom-10 right-4"><Sparkles size={16} className={`${mode==='velvet'?'text-[#C6A649]':'text-blue-500'} opacity-50`}/></div>
            </div>

            {/* DURATION & RATIO */}
            <div className={`grid grid-cols-2 gap-8 pt-6 border-t ${mode==='velvet'?'border-white/5':'border-gray-100'}`}>
                <div className="space-y-4">
                    <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest opacity-40">Duration</span><span className={`font-bold text-xs ${mode==='velvet'?'text-[#C6A649]':'text-blue-600'}`}>{dur}s</span></div>
                    <div className={`flex gap-2 p-1.5 rounded-2xl border ${mode==='velvet'?'bg-black/40 border-white/10':'bg-gray-100 border-gray-200'}`}>
                        <button onClick={()=>setDur(5)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${dur===5 ? (mode==='velvet'?S.activeTab:'bg-white shadow text-black') : 'text-gray-400'}`}>5s (10cr)</button>
                        <button onClick={()=>setDur(10)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${dur===10 ? (mode==='velvet'?S.activeTab:'bg-white shadow text-black') : 'text-gray-400'}`}>10s (20cr)</button>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest opacity-40">Ratio</span></div>
                    <div className={`flex gap-2 p-1.5 rounded-2xl border ${mode==='velvet'?'bg-black/40 border-white/10':'bg-gray-100 border-gray-200'}`}>
                        {RATIOS.map(r => (
                            <button key={r.id} onClick={() => setRatio(r.id)} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${ratio === r.id ? (mode==='velvet'?S.activeTab:'bg-white shadow text-black') : 'text-gray-400'}`}>{r.id}</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* ACTION BUTTON */}
        <button onClick={generate} disabled={loading || (!img && !vid)} className={`w-full py-7 rounded-[32px] font-bold uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 fixed bottom-6 left-4 right-4 lg:static lg:w-full z-50
            ${mode==='velvet'
                ? (velvetFilter ? S.btnVelvet : S.btnGold)
                : 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-blue-500/30 transition-all'
            }`}>
            {loading ? "Processing..." : <><Zap size={18}/> {t('studio.generate')} ({calculateCost()})</>}
        </button>
      </div>

      {/* RIGHT PANEL: PREVIEW */}
      <div className="lg:col-span-5 relative z-10 flex flex-col items-center pt-8">
         <div className={`sticky top-8 w-full max-w-[420px] rounded-[40px] border overflow-hidden shadow-2xl relative transition-all duration-500
            ${ratio==='16:9'?'aspect-video':ratio==='1:1'?'aspect-square':'aspect-[9/16]'}
            ${mode==='velvet' ? 'bg-black border-white/10' : 'bg-gray-900 border-gray-200'}
         `}>
            <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20 pointer-events-none opacity-60"><div className="text-[10px] text-white font-mono flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> REC</div><div className="text-[10px] text-white font-mono">{dur}s • 4K</div></div>

            {!resUrl && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10 gap-6">
                    <div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center"><Video size={40} strokeWidth={1}/></div>
                    <span className="text-[9px] uppercase tracking-[0.4em] font-light">Preview</span>
                </div>
            )}

            {loading && (
                <div className="absolute inset-0 bg-[#050505] z-30 flex flex-col items-center justify-center">
                    <div className={`w-20 h-20 border-t-2 border-r-2 rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(198,166,73,0.2)]
                        ${mode==='velvet' ? 'border-[#C6A649]' : 'border-blue-500 shadow-blue-500/20'}
                    `}></div>
                    <p className={`text-[10px] uppercase tracking-widest animate-pulse font-bold ${mode==='velvet'?'text-[#C6A649]':'text-blue-500'}`}>{t('studio.processing')}</p>
                </div>
            )}

            {resUrl && <video src={resUrl} controls autoPlay loop className="w-full h-full object-cover"/>}
         </div>
         {resUrl && <a href={resUrl} download className="mt-8 px-12 py-5 bg-white text-black rounded-full text-[10px] font-bold uppercase hover:scale-105 transition-transform flex gap-3 shadow-2xl"><Download size={16}/> Download 4K</a>}
      </div>
    </div>
  );
};
