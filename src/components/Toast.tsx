import React, { useEffect } from 'react';
import { Check } from 'lucide-react';

export const Toast = ({ msg, onClose }: { msg: string, onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 fade-in">
      <div className="bg-[#050505]/95 backdrop-blur-xl border border-[#C6A649] px-6 py-4 rounded-full flex items-center gap-4 shadow-[0_0_40px_rgba(198,166,73,0.3)]">
        <Check size={14} className="text-[#C6A649]"/>
        <span className="text-white text-xs font-bold uppercase tracking-widest">{msg}</span>
      </div>
    </div>
  );
};
