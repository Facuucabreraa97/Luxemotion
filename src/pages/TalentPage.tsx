import React, { useState } from 'react';
import { Upload, X, Plus, User, Briefcase, Camera, ShoppingBag, Loader2 } from 'lucide-react';
import { S } from '../styles';
import { Talent } from '../types';
import { useMode } from '../context/ModeContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

export const TalentPage = ({ list, add, del, notify }: any) => {
  const { mode } = useMode();
  const { t } = useTranslation();

  const [img, setImg] = useState<string|null>(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [role, setRole] = useState('model'); // model | brand_ambassador
  const [open, setOpen] = useState(false);
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [sellPrice, setSellPrice] = useState<string>('');

  const handleFile = (e:any) => { const f=e.target.files[0]; if(f){const r=new FileReader(); r.onload=()=>setImg(r.result as string); r.readAsDataURL(f);} };

  const save = () => {
      if(img && name) {
          add({id:Date.now().toString(), name, image_url:img, role, notes});
          setOpen(false);
          setImg(null);
          setName('');
          setNotes('');
          notify(t('talent.created_success'));
      }
  };

  const handleSell = async (id: string) => {
      if (!sellPrice) return;
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            notify(t('explore.buy.login_required')); // Reuse login required message
            return;
          }

          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/marketplace/list`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({ talent_id: id, price: parseInt(sellPrice) })
          });

          if (res.ok) {
              notify(t('talent.listed_success'));
              setSellingId(null);
              setSellPrice('');
          } else {
              notify(t('common.error'));
          }
      } catch (e) {
          notify(t('common.error'));
      }
  };

  const isVelvet = mode === 'velvet';

  return (
    <div className="p-6 lg:p-12 pb-32 animate-in fade-in">
        {}
        <div className={`flex justify-between items-end border-b pb-8 mb-12 ${isVelvet?'border-white/10':'border-gray-200'}`}>
            <div>
                <h2 className={`text-4xl font-bold uppercase tracking-[0.1em] ${isVelvet?'text-white':'text-gray-900'}`}>{t('common.nav.talent')}</h2>
                <p className={isVelvet ? S.subLuxe : "text-[9px] text-blue-600 mt-2 uppercase tracking-[0.4em] font-bold"}>{isVelvet ? "Database" : "Brand Assets"}</p>
            </div>
            <button onClick={()=>setOpen(!open)} className={`px-8 py-3 rounded-full text-[10px] uppercase font-bold transition-all flex items-center gap-2 border ${isVelvet ? 'border-white/20 text-white hover:bg-[#C6A649] hover:text-black' : 'border-gray-300 text-gray-700 hover:bg-black hover:text-white'}`}>
                {open?<X size={14}/>:<Plus size={14}/>} {open?t('common.cancel'):"New Persona"}
            </button>
        </div>

        {}
        {open && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 p-12 rounded-[40px] mb-12 transition-all duration-500 ${isVelvet ? S.panel : 'bg-white shadow-xl border border-gray-100'}`}>
                <div className={`aspect-[3/4] rounded-[30px] border-2 border-dashed flex items-center justify-center relative overflow-hidden group cursor-pointer transition-all
                    ${isVelvet ? 'bg-black/30 border-white/10 hover:border-[#C6A649]/50' : 'bg-gray-50 border-gray-300 hover:border-blue-500'}`}>
                    {img ? <img src={img} className="w-full h-full object-cover"/> : (
                        <div className={`text-center ${isVelvet?'opacity-30':'opacity-50 text-gray-500'}`}>
                            <Camera className="mx-auto mb-4 w-8 h-8"/>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Upload Portrait</span>
                        </div>
                    )}
                    <input type="file" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer"/>
                </div>

                <div className="flex flex-col justify-center gap-8">
                    <div className="space-y-4">
                        <label className={`text-[10px] uppercase tracking-widest ${isVelvet?'text-white/40':'text-gray-400'}`}>Persona Name</label>
                        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Sofia / Nike Air" className={isVelvet ? S.input : "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none focus:border-blue-500 transition-all"}/>
                    </div>

                    <div className="space-y-4">
                        <label className={`text-[10px] uppercase tracking-widest ${isVelvet?'text-white/40':'text-gray-400'}`}>DNA / Notes</label>
                        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Ex: Pale skin, neck tattoo, blue eyes..." className={`${isVelvet ? S.input : "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none focus:border-blue-500 transition-all"} h-24 resize-none`}/>
                    </div>

                    {}
                    {!isVelvet && (
                        <div className="space-y-4">
                             <label className="text-[10px] uppercase tracking-widest text-gray-400">Asset Type</label>
                             <div className="flex gap-4">
                                <button onClick={()=>setRole('model')} className={`flex-1 py-3 border rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase transition-all ${role==='model'?'bg-black text-white border-black':'text-gray-400 border-gray-200'}`}><User size={14}/> Virtual Model</button>
                                <button onClick={()=>setRole('brand')} className={`flex-1 py-3 border rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase transition-all ${role==='brand'?'bg-blue-600 text-white border-blue-600':'text-gray-400 border-gray-200'}`}><Briefcase size={14}/> Product / Logo</button>
                             </div>
                        </div>
                    )}

                    <button onClick={save} disabled={!img || !name} className={`w-full py-5 rounded-2xl text-[10px] font-bold uppercase transition-transform hover:scale-[1.02] active:scale-95 ${isVelvet ? S.btnGold : 'bg-black text-white shadow-xl hover:bg-gray-800'}`}>
                        {t('common.save')}
                    </button>
                </div>
            </div>
        )}

        {}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {list.map((inf:Talent) => (
                <div key={inf.id} className={`rounded-[30px] overflow-hidden relative group transition-all duration-500 hover:-translate-y-2 ${isVelvet ? S.panel : 'bg-white shadow-lg border border-gray-100'}`}>
                    <img src={inf.image_url} className="aspect-[3/4] object-cover w-full group-hover:scale-105 transition-transform duration-700"/>
                    <div className="absolute bottom-0 inset-x-0 p-6 pt-20 flex justify-between items-end bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                        <div>
                             <span className="text-[10px] font-bold uppercase tracking-widest text-white block">{inf.name}</span>
                             {}
                             {(inf as any).role === 'brand' && <span className="text-[8px] font-bold uppercase bg-blue-600 text-white px-2 py-0.5 rounded-full mt-1 inline-block">Brand</span>}

                             {}
                             {(inf as any).for_sale && <span className="text-[8px] font-bold uppercase bg-[#C6A649] text-black px-2 py-0.5 rounded-full mt-1 inline-block ml-2">For Sale: {(inf as any).price} CR</span>}
                        </div>
                        <div className="flex gap-2">
                            {}
                            {!((inf as any).for_sale) && (
                                <button onClick={()=>setSellingId(sellingId === inf.id ? null : inf.id)} className="bg-white/10 p-2 rounded-full text-white/50 hover:text-[#C6A649] hover:bg-white/20 transition-all backdrop-blur-md">
                                    <ShoppingBag size={12}/>
                                </button>
                            )}
                            <button onClick={()=>del(inf.id)} className="bg-white/10 p-2 rounded-full text-white/50 hover:text-red-500 hover:bg-white/20 transition-all backdrop-blur-md">
                                <X size={12}/>
                            </button>
                        </div>
                    </div>

                    {}
                    {sellingId === inf.id && (
                        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                            <h3 className="text-white text-xs font-bold uppercase mb-4">Sell {inf.name}</h3>
                            <input
                                type="number"
                                placeholder="Price (Credits)"
                                value={sellPrice}
                                onChange={(e)=>setSellPrice(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded p-2 text-white text-xs mb-4 text-center focus:outline-none focus:border-[#C6A649]"
                            />
                            <div className="flex gap-2 w-full">
                                <button onClick={()=>setSellingId(null)} className="flex-1 py-2 bg-white/10 text-white text-[10px] font-bold uppercase rounded hover:bg-white/20">Cancel</button>
                                <button onClick={()=>handleSell(inf.id)} className="flex-1 py-2 bg-[#C6A649] text-black text-[10px] font-bold uppercase rounded hover:bg-[#d4b55b]">List</button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
};
