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
    <div className="hidden lg:flex flex-col w-[280px] h-full bg-[#050505] border-r border-white/5 p-6 z-50 relative">
      {/* BRAND */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center">
          <span className="font-bold text-black text-xl">L</span>
        </div>
        <span className="text-xl font-bold text-white tracking-wider">LUXEMOTION</span>
      </div>

      {/* NAV */}
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                ? 'bg-[#D4AF37] text-black font-bold shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <item.icon size={20} />
            <span className="text-sm uppercase tracking-widest">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* FOOTER */}
      <div className="mt-auto pt-6 border-t border-white/5">
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-900/10 rounded-xl w-full transition-colors">
          <LogOut size={20} />
          <span className="text-sm font-bold uppercase tracking-widest">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
