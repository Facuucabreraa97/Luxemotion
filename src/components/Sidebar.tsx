import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, Image as ImageIcon, CreditCard, Settings, LayoutGrid, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Sidebar() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const navItems = [
    { icon: Sparkles, label: 'Studio', path: '/app/studio' },
    { icon: ImageIcon, label: 'Gallery', path: '/app/gallery' },
    { icon: LayoutGrid, label: 'Explore', path: '/app/explore' },
    { icon: CreditCard, label: 'Plan', path: '/app/plan' },
    { icon: Settings, label: 'Settings', path: '/app/settings' },
  ];

  return (
    <div className="hidden lg:flex flex-col w-[280px] h-full bg-[#050505] border-r border-white/5 p-6 font-sans">
      <div className="flex items-center gap-3 px-2 mb-12">
        <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#8C721F] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)]">
          <span className="font-bold text-black text-xl">L</span>
        </div>
        <span className="text-xl font-bold text-white tracking-widest">LUXEMOTION</span>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive
                ? 'bg-white/5 border border-white/10 text-[#D4AF37] shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`
            }
          >
            <item.icon size={20} className={({ isActive }) => isActive ? "text-[#D4AF37] drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]" : ""} />
            <span className="text-xs font-bold uppercase tracking-[0.15em]">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5">
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500/70 hover:text-red-500 hover:bg-red-500/5 rounded-xl w-full transition-all">
          <LogOut size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
