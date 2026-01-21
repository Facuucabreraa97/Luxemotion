import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Globe, Users, Image as ImageIcon, DollarSign, CreditCard, Settings } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname;

  // DICTIONARY: STRICT SPANISH (LATAM NEUTRAL)
  const navItems = [
    { label: 'ESTUDIO', icon: Home, path: '/app' },
    { label: 'EXPLORAR', icon: Globe, path: '/app/explore' },
    { label: 'CASTING', icon: Users, path: '/app/talent' }, // Fixed path from /app/casting to /app/talent based on consistency
    { label: 'GALERÍA', icon: ImageIcon, path: '/app/gallery' },
    { label: 'GANANCIAS', icon: DollarSign, path: '/app/earnings' },
    { label: 'PLAN', icon: CreditCard, path: '/app/billing' }, // Fixed path /app/plan -> /app/billing
    { label: 'AJUSTES', icon: Settings, path: '/app/settings' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] pb-[env(safe-area-inset-bottom)]">
      {/* BLUR BACKDROP */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl border-t border-white/10" />

      <div className="relative flex justify-around items-center px-2 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/app' && pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-all duration-300 active:scale-95 ${isActive ? 'text-[#C6A649] scale-105' : 'text-white/40 hover:text-white'}`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[8px] font-bold tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
