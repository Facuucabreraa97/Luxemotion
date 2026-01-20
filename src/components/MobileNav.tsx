import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, Image as ImageIcon, CreditCard, Settings, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const MobileNav = () => {
  const { t } = useTranslation();
  return (
    <div className="lg:hidden fixed bottom-0 w-full bg-[#0a0a0a] border-t border-white/10 flex justify-around p-2 pb-6 z-50">
      <Link to="/app" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1"><LayoutDashboard size={20} /><span className="text-[8px] uppercase font-bold">{t('common.nav.studio')}</span></Link>
      <Link to="/app/talent" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1"><Users size={20} /><span className="text-[8px] uppercase font-bold">{t('common.nav.talent')}</span></Link>
      <Link to="/app/gallery" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1"><ImageIcon size={20} /><span className="text-[8px] uppercase font-bold">{t('common.nav.gallery')}</span></Link>
      <Link to="/app/earnings" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1"><DollarSign size={20} /><span className="text-[8px] uppercase font-bold">Ganancias</span></Link>
      <Link to="/app/billing" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1"><CreditCard size={20} /><span className="text-[8px] uppercase font-bold">{t('common.nav.billing')}</span></Link>
      <Link to="/settings" className="p-3 text-white/50 hover:text-[#C6A649] flex flex-col items-center gap-1"><Settings size={20} /><span className="text-[8px] uppercase font-bold">{t('common.nav.settings')}</span></Link>
    </div>
  );
};
