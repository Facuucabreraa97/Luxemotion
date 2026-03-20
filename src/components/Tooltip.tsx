import React from 'react';
import { Info } from 'lucide-react';

export const Tooltip = ({ txt }: { txt: string }) => (
  <div className="group relative inline-flex ml-2 cursor-help align-middle z-50">
    <Info size={14} className="text-white/30 hover:text-[#C6A649] transition-colors"/>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 bg-[#111] border border-[#C6A649]/30 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-[10px] text-gray-300 text-center pointer-events-none shadow-xl backdrop-blur-md">
      {txt}
    </div>
  </div>
);
