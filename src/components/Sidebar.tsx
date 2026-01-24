
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
      <div className="mb-12 px-2">
        <h1 className="text-xl font-bold text-white tracking-widest text-[#D4AF37]">MIVIDEOAI</h1>
        <p className="text-[10px] text-zinc-600 uppercase tracking-[0.3em]">WRAPPER</p>
      </div>
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map(i => (
          <NavLink key={i.path} to={i.path} className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-white/5 text-[#D4AF37] border border-[#D4AF37]/20' : 'text-zinc-500 hover:text-white'}`}>
            <i.icon size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">{i.label}</span>
          </NavLink>
        ))}
      </nav>
      <button onClick={() => supabase.auth.signOut().then(() => window.location.href='/login')} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-900/10 rounded-xl mt-auto"><LogOut size={18}/><span className="text-xs font-bold uppercase tracking-widest">Logout</span></button>
    </div>
  );
}
