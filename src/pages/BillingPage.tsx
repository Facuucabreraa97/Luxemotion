import React, { useState } from 'react';
import { Zap, Check } from 'lucide-react';
import { PRICING } from '../constants';
import { S } from '../styles';

export const BillingPage = ({ onSelect }: any) => {
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
