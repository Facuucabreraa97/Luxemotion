import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, Image as ImageIcon, CreditCard, Settings, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const MobileNav = () => {
  const { t } = useTranslation();
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] bg-black/80 backdrop-blur-xl border-t border-white/10 flex justify-around p-2 pb-6">
      <Link to="/app" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1 active:scale-95 transition-transform">
        <LayoutDashboard size={20} strokeWidth={1.5} />
        <span className="text-[8px] uppercase font-bold tracking-wider">{t('common.nav.studio')}</span>
      </Link>
      <Link to="/app/talent" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1 active:scale-95 transition-transform">
        <Users size={20} strokeWidth={1.5} />
        <span className="text-[8px] uppercase font-bold tracking-wider">{t('common.nav.talent')}</span>
      </Link>
      <Link to="/app/gallery" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1 active:scale-95 transition-transform">
        <ImageIcon size={20} strokeWidth={1.5} />
        <span className="text-[8px] uppercase font-bold tracking-wider">{t('common.nav.gallery')}</span>
      </Link>
      <Link to="/app/earnings" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1 active:scale-95 transition-transform">
        <DollarSign size={20} strokeWidth={1.5} />
        <span className="text-[8px] uppercase font-bold tracking-wider">Ganancias</span>
      </Link>
      <Link to="/app/billing" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1 active:scale-95 transition-transform">
        <CreditCard size={20} strokeWidth={1.5} />
        <span className="text-[8px] uppercase font-bold tracking-wider">{t('common.nav.billing')}</span>
      </Link>
      <Link to="/settings" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1 active:scale-95 transition-transform">
        <Settings size={20} strokeWidth={1.5} />
        <span className="text-[8px] uppercase font-bold tracking-wider">{t('common.nav.settings')}</span>
      </Link>
    </div>
  );
};
