import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, Image as ImageIcon, LayoutGrid, CreditCard, Settings } from 'lucide-react';

export default function MobileNav() {
  const navItems = [
    { icon: Sparkles, label: 'Studio', path: '/app/studio' },
    { icon: ImageIcon, label: 'Gallery', path: '/app/gallery' },
    { icon: LayoutGrid, label: 'Explore', path: '/app/explore' },
    { icon: CreditCard, label: 'Plan', path: '/app/plan' },
    { icon: Settings, label: 'Settings', path: '/app/settings' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#050505]/95 backdrop-blur-xl border-t border-white/10 z-[100] pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${isActive ? 'text-[#D4AF37]' : 'text-zinc-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && <div className="w-1 h-1 bg-[#D4AF37] rounded-full mt-1" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
