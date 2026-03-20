import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { S } from '../styles';

export const SettingsPage = ({ profile, setProfile, notify }: any) => {
  const [data, setData] = useState(profile);

  const save = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if(user) {
          const { error } = await supabase.from('profiles').update({
              instagram: data.instagram,
              telegram: data.telegram,
              phone: data.phone
          }).eq('id', user.id);

          if(error) {
              console.error("Error saving profile", error);
              notify("Error al guardar");
          } else {
              notify("Perfil Actualizado");
          }
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
