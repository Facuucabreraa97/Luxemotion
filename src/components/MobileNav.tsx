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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#050505]/90 backdrop-blur-xl border-t border-white/10 z-50 pb-safe pt-2 px-6">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all duration-300 relative ${isActive ? 'text-[#D4AF37]' : 'text-zinc-600 hover:text-zinc-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-full transition-all ${isActive ? 'bg-[#D4AF37]/10' : ''}`}>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-[#D4AF37] rounded-full shadow-[0_0_10px_#D4AF37]" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
