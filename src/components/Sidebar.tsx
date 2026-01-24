import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, Image as ImageIcon, CreditCard, Settings, LayoutGrid, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Sidebar() {
  const navItems = [
    { icon: Sparkles, label: 'Studio', path: '/app/studio' },
    { icon: ImageIcon, label: 'Gallery', path: '/app/gallery' },
    { icon: LayoutGrid, label: 'Explore', path: '/app/explore' },
    { icon: CreditCard, label: 'Plan', path: '/app/plan' },
    { icon: Settings, label: 'Settings', path: '/app/settings' },
  ];
  return (
    <div className="hidden lg:flex flex-col w-[280px] h-full bg-[#050505] border-r border-white/5 p-6">
      <div className="mb-12 flex items-center gap-3"><div className="w-8 h-8 bg-[#D4AF37] rounded flex items-center justify-center font-bold text-black">L</div><span className="font-bold tracking-widest text-white">LUXEMOTION</span></div>
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map(i => (
          <NavLink key={i.path} to={i.path} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-white/5 text-[#D4AF37]' : 'text-zinc-500 hover:text-white'}`}>
            <i.icon size={20} /><span className="text-xs font-bold uppercase tracking-widest">{i.label}</span>
          </NavLink>
        ))}
      </nav>
      <button onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-900/10 rounded-xl mt-auto"><LogOut size={20} /><span className="text-xs font-bold uppercase tracking-widest">Sign Out</span></button>
    </div>
  );
}
