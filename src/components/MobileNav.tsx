import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, Image as ImageIcon, CreditCard, Settings } from 'lucide-react';

export const MobileNav = () => (
  <div className="lg:hidden fixed bottom-0 w-full bg-[#0a0a0a] border-t border-white/10 flex justify-around p-2 pb-6 z-50">
      <Link to="/" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1"><LayoutDashboard size={20}/><span className="text-[8px] uppercase font-bold">Studio</span></Link>
      <Link to="/talent" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1"><Users size={20}/><span className="text-[8px] uppercase font-bold">Casting</span></Link>
      <Link to="/gallery" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1"><ImageIcon size={20}/><span className="text-[8px] uppercase font-bold">Galeria</span></Link>
      <Link to="/billing" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1"><CreditCard size={20}/><span className="text-[8px] uppercase font-bold">Plan</span></Link>
      <Link to="/settings" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1"><Settings size={20}/><span className="text-[8px] uppercase font-bold">Ajustes</span></Link>
  </div>
);
