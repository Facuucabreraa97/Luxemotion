import React, { useState } from 'react';
import { Upload, X, Plus } from 'lucide-react';
import { S } from '../styles';
import { Talent } from '../types';

export const TalentPage = ({ list, add, del, notify }: any) => {
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
