import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Sparkles, Film, Plus, Zap, Lock, Video, Download, Flame, Move, ZoomIn, Heart, Smartphone, Monitor, Square } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { S } from '../styles';
import { CONFIG } from '../config';
import { Tooltip } from '../components/Tooltip';
import { VelvetModal } from '../components/VelvetModal';
import { Talent } from '../types';

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
          const r = await fetch(`${CONFIG.API_URL}/generate`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
              body: JSON.stringify({ image: img, endImage: prod, inputVideo: vid, prompt, duration: dur, aspectRatio: ratio, mode: velvet?'velvet':'standard', velvetStyle: velvet?velvetStyle:null })
          });
          const d = await r.json();
          if(d.videoUrl) { setResUrl(d.videoUrl); onGen({url: d.videoUrl, cost, id: Date.now().toString(), date: new Date().toLocaleDateString(), prompt, aspectRatio: ratio}); notify("¡Video Generado!"); } else throw new Error(d.error);
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
