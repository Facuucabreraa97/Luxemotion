import React from 'react';
import { Play, Zap } from 'lucide-react';

export const MobileHeader = ({ credits }: any) => (
  <div className="lg:hidden fixed top-0 w-full p-4 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 z-50 flex justify-between items-center">
      <div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#C6A649] rounded-lg flex items-center justify-center text-black"><Play fill="black" size={14}/></div><span className="text-sm font-bold tracking-[0.2em] text-white">LUXE</span></div>
      <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full"><span className="text-xs font-bold text-white">{credits}</span><Zap size={12} className="text-[#C6A649] fill-[#C6A649]"/></div>
  </div>
);
