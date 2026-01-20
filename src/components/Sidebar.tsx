import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Video, Users, Image as ImageIcon, CreditCard, Settings, LogOut, Zap, Crown, ChevronRight, Globe, TrendingUp, DollarSign } from 'lucide-react';
import { useMode } from '../context/ModeContext';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '../types';
import { CheckoutModal } from './CheckoutModal';
import { VelvetBenefitsModal } from './VelvetBenefitsModal';

interface SidebarProps {
  credits: number;
  onLogout: () => void;
  onUp: () => void;
  userProfile?: UserProfile;
  onUpgrade: () => void;
  notify: (msg: string) => void;
}

export const Sidebar = ({ credits, onLogout, onUp, userProfile, onUpgrade, notify }: SidebarProps) => {
  const { pathname } = useLocation();
  const { mode, toggleMode, setMode } = useMode();
  const { t, i18n } = useTranslation();
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
  const [showVelvetBenefits, setShowVelvetBenefits] = React.useState(false);

  const links = [
    { icon: Video, label: t('common.nav.studio'), path: '/app' },
    { icon: Globe, label: 'Explore', path: '/app/explore' },
    { icon: Users, label: t('common.nav.talent'), path: '/app/talent' },
    { icon: ImageIcon, label: t('common.nav.gallery'), path: '/app/gallery' },
    { icon: DollarSign, label: 'Ganancias', path: '/app/earnings' },
    { icon: CreditCard, label: t('common.nav.billing'), path: '/app/billing' },
    { icon: Settings, label: t('common.nav.settings'), path: '/app/settings' },
  ];

  const handleLang = () => {
    const next = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(next);
  };

  const handleModeToggle = () => {
    if (mode === 'velvet') {
      setMode('agency');
    } else {
      const canAccess = userProfile?.is_admin || userProfile?.plan === 'creator' || userProfile?.plan === 'agency';
      if (canAccess) {
        setMode('velvet');
        notify('High Fidelity Mode activated. Credit consumption increases due to 8K post-processing.');
      } else {
        setShowVelvetBenefits(true);
      }
    }
  };

  return (
    <>
      {showVelvetBenefits && (
        <VelvetBenefitsModal
          onClose={() => setShowVelvetBenefits(false)}
          onUnlock={() => {
            setShowVelvetBenefits(false);
            setShowUpgradeModal(true);
          }}
        />
      )}
      {showUpgradeModal && <CheckoutModal planKey="creator" annual={true} onClose={() => setShowUpgradeModal(false)} />}
      <aside className={`fixed left-0 top-0 h-screen w-80 flex flex-col hidden lg:flex border-r transition-all duration-500 z-50
          ${mode === 'velvet' ? 'bg-black/95 border-white/5 backdrop-blur-xl' : 'bg-[#F8F9FA] border-gray-200'}`}>

        {/* HEADER */}
        <div className="p-8 pb-4">
          {/* ADAPTIVE LOGO */}
          {mode === 'velvet' ? (
            <h1 className="text-2xl font-bold tracking-[0.2em] uppercase mb-1 text-white">Mivideo<span className="text-[#C6A649]">AI</span></h1>
          ) : (
            <h1 className="text-2xl font-bold tracking-[0.2em] uppercase mb-1 text-black">MivideoAI</h1>
          )}

          <div className="flex items-center justify-between">
            <p className="text-[9px] text-gray-500 uppercase tracking-[0.4em] font-bold">AI Video Generator</p>
            <button onClick={handleLang} className={`text-[9px] font-bold uppercase px-2 py-1 rounded border transition-colors ${mode === 'velvet' ? 'border-white/10 text-gray-400 hover:text-white' : 'border-gray-300 text-gray-500 hover:text-black hover:border-gray-400'}`}>
              {i18n.language.toUpperCase()}
            </button>
          </div>
        </div>

        {/* MODE SWITCHER */}
        <div className="px-8 mb-6">
          <button id="sidebar-mode-toggle" onClick={handleModeToggle} className={`w-full p-1 rounded-full border flex items-center relative overflow-hidden group transition-all duration-500
              ${mode === 'velvet' ? 'bg-black border-white/10' : 'bg-gray-200 border-gray-300'}`}>
            <div className={`w-1/2 text-[9px] font-bold uppercase text-center py-2 rounded-full relative z-10 transition-colors ${mode === 'velvet' ? 'text-white' : 'text-gray-500'}`}>Velvet</div>
            <div className={`w-1/2 text-[9px] font-bold uppercase text-center py-2 rounded-full relative z-10 transition-colors ${mode === 'agency' ? 'text-black' : 'text-gray-500'}`}>Agency</div>
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-transform duration-500 ease-out shadow-lg
                  ${mode === 'velvet' ? 'translate-x-1 bg-[#C6A649]' : 'translate-x-[calc(100%+4px)] bg-white'}`}></div>
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {links.map((l) => {
            const active = pathname === l.path;
            // Agency Mode: Active link is White BG (or very light) with Black Text & Icon
            // Velvet Mode: Active link is Dark BG with Gold/White

            const containerClass = active
              ? (mode === 'velvet' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm')
              : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'; // using dark: just in case, but manual control is better

            const iconColor = active
              ? (mode === 'velvet' ? 'text-[#C6A649]' : 'text-black')
              : (mode === 'velvet' ? 'text-gray-600 group-hover:text-white' : 'text-gray-400 group-hover:text-black');

            const textColor = active
              ? (mode === 'velvet' ? 'text-white' : 'text-black')
              : (mode === 'velvet' ? 'text-gray-500 group-hover:text-white' : 'text-gray-500 group-hover:text-black');

            return (
              <NavLink key={l.path} to={l.path} className={`flex items-center gap-4 px-6 py-4 rounded-2xl border transition-all duration-300 group relative overflow-hidden ${containerClass}`}>
                <l.icon size={18} className={`transition-colors duration-300 ${iconColor}`} />
                <span className={`text-[11px] font-bold uppercase tracking-widest ${textColor}`}>{l.label}</span>
                {active && <ChevronRight size={14} className={`absolute right-4 ${mode === 'velvet' ? 'text-[#C6A649]' : 'text-black'}`} />}
              </NavLink>
            );
          })}
        </nav>

        {/* FOOTER / CREDITS */}
        <div className={`p-6 m-4 rounded-[2rem] border relative overflow-hidden group transition-all duration-500 ${mode === 'velvet' ? 'bg-gradient-to-br from-[#1a1a1a] to-black border-white/10' : 'bg-white border-gray-200 shadow-lg'}`}>
          <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${mode === 'velvet' ? 'text-[#C6A649]' : 'text-black'}`}><Zap size={80} /></div>
          <div className="relative z-10">
            <p className={`text-[9px] uppercase font-bold tracking-widest mb-2 ${mode === 'velvet' ? 'text-gray-400' : 'text-gray-500'}`}>Créditos Disponibles</p>
            <div className={`text-4xl font-bold mb-4 flex items-baseline gap-1 ${mode === 'velvet' ? 'text-white' : 'text-black'}`}>{userProfile?.is_admin ? '∞' : credits}<span className="text-sm font-normal text-gray-500">cr</span></div>
            <button onClick={onUp} className={`w-full py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg
                  ${mode === 'velvet' ? 'bg-[#C6A649] text-black hover:bg-[#d4b55b]' : 'bg-black text-white hover:bg-gray-800'}`}>
              <Crown size={14} /> Recargar
            </button>
          </div>
        </div>

        <div className="px-8 pb-8">
          <button onClick={onLogout} className="flex items-center gap-3 text-[10px] font-bold uppercase text-red-500/50 hover:text-red-500 transition-colors tracking-widest pl-2">
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
};
