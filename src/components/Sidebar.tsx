import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Zap, LayoutDashboard, Users, Image as ImageIcon, CreditCard, Settings, LogOut } from 'lucide-react';

export const Sidebar = ({ credits, onLogout, onUp }: any) => (
  <aside className="hidden lg:flex w-80 flex-col p-10 border-r border-white/5 bg-[#0a0a0a] fixed h-full z-50">
      <div className="flex items-center gap-4 mb-16"><div className="w-12 h-12 bg-gradient-to-br from-[#C6A649] to-black rounded-2xl flex items-center justify-center shadow-lg"><Play fill="white" size={20} className="text-white ml-1"/></div><div><h1 className="text-xl font-bold tracking-[0.2em] leading-none text-white">LUXE<span className="block text-[8px] text-[#C6A649] mt-1 font-normal tracking-[0.4em]">MOTION PRO</span></h1></div></div>
      <nav className="space-y-4 flex-1">
          <Link to="/" className="flex items-center gap-5 p-4 rounded-2xl text-white/50 hover:text-white hover:bg-white/5 transition-all group"><LayoutDashboard size={20} className="group-hover:text-[#C6A649] transition-colors"/><span className="text-[10px] font-bold uppercase tracking-widest">Studio</span></Link>
          <Link to="/talent" className="flex items-center gap-5 p-4 rounded-2xl text-white/50 hover:text-white hover:bg-white/5 transition-all group"><Users size={20} className="group-hover:text-[#C6A649] transition-colors"/><span className="text-[10px] font-bold uppercase tracking-widest">Casting</span></Link>
          <Link to="/gallery" className="flex items-center gap-5 p-4 rounded-2xl text-white/50 hover:text-white hover:bg-white/5 transition-all group"><ImageIcon size={20} className="group-hover:text-[#C6A649] transition-colors"/><span className="text-[10px] font-bold uppercase tracking-widest">Portfolio</span></Link>
          <Link to="/billing" className="flex items-center gap-5 p-4 rounded-2xl text-white/50 hover:text-white hover:bg-white/5 transition-all group"><CreditCard size={20} className="group-hover:text-[#C6A649] transition-colors"/><span className="text-[10px] font-bold uppercase tracking-widest">Planes</span></Link>
          <Link to="/settings" className="flex items-center gap-5 p-4 rounded-2xl text-white/50 hover:text-white hover:bg-white/5 transition-all group"><Settings size={20} className="group-hover:text-[#C6A649] transition-colors"/><span className="text-[10px] font-bold uppercase tracking-widest">Ajustes</span></Link>
      </nav>
      <div onClick={onUp} className="mt-auto bg-gradient-to-br from-[#111] to-black p-8 rounded-[32px] border border-white/5 group cursor-pointer hover:border-[#C6A649]/30 transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#C6A649]"></div>
          <div className="flex justify-between items-start mb-6"><span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Saldo Actual</span><div className="bg-[#C6A649]/10 px-3 py-1.5 rounded-lg text-[8px] font-bold text-[#C6A649] uppercase group-hover:bg-[#C6A649] group-hover:text-black transition-colors">Recargar</div></div>
          <div className="flex items-center gap-3"><span className="text-5xl font-bold text-white tracking-tighter">{credits}</span><Zap size={24} className="text-[#C6A649] fill-[#C6A649]"/></div>
      </div>
      <button onClick={onLogout} className="mt-8 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-red-500/50 hover:text-red-500 pl-4 transition-colors"><LogOut size={16}/> Cerrar Sesión</button>
  </aside>
);
