import React from 'react';
import { ChevronRight, X, Flame } from 'lucide-react';
import { S } from '../styles';

export const VelvetModal = ({ onClose, onOk }: { onClose: () => void, onOk: () => void }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-in zoom-in duration-300">
    <div className={`w-full max-w-sm p-1 rounded-[40px] relative group overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-900 opacity-50 blur-xl"></div>
      <div className="bg-[#050505] relative rounded-[38px] p-8 text-center border border-pink-500/30 h-full">
        <button onClick={onClose} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"><X size={20}/></button>
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-tr from-pink-600 to-purple-900 rounded-full flex items-center justify-center border border-pink-500/50 shadow-lg">
             <Flame size={32} className="text-white fill-white"/>
        </div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400 uppercase tracking-[0.2em] mb-4">Velvet Mode</h2>
        <div className="inline-block px-4 py-1 border border-pink-500/30 rounded-full bg-pink-500/10 mb-6"><span className="text-[9px] font-bold text-pink-400 uppercase tracking-[0.3em]">Solo Adultos +18</span></div>
        <p className="text-white/50 text-xs mb-8 leading-relaxed">Generación sin censura optimizada para hiperrealismo, texturas de piel y contenido insinuante.</p>
        <button onClick={onOk} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 group ${S.btnVelvet}`}><span>Desbloquear</span> <ChevronRight size={16}/></button>
      </div>
    </div>
  </div>
);
