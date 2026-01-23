import React, { useState } from 'react';
import { Play, Zap } from 'lucide-react';
import { useMode } from '../context/ModeContext';
import { useTranslation } from 'react-i18next';
import { VelvetBenefitsModal } from './VelvetBenefitsModal';
import { CheckoutModal } from './CheckoutModal';
import { UserProfile } from '../types';

interface MobileHeaderProps {
  credits: number;
  userProfile?: UserProfile;
  onUpgrade: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ credits, userProfile, onUpgrade }) => {
  const { mode, setMode } = useMode();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showVelvetBenefits, setShowVelvetBenefits] = useState(false);
  const { t } = useTranslation();

  const handleModeToggle = () => {
    if (mode === 'velvet') {
      setMode('agency');
    } else {
      const canAccess = userProfile?.is_admin || userProfile?.plan === 'creator' || userProfile?.plan === 'agency';
      if (canAccess) {
        setMode('velvet');
      } else {
        setShowVelvetBenefits(true);
      }
    }
  };

  return (
    <>
      {showVelvetBenefits && <VelvetBenefitsModal onClose={() => setShowVelvetBenefits(false)} onUnlock={() => { setShowVelvetBenefits(false); setShowUpgradeModal(true); }} />}
      {showUpgradeModal && <CheckoutModal planKey="creator" annual={true} onClose={() => setShowUpgradeModal(false)} />}
      <div className={`lg:hidden fixed top-0 w-full p-4 border-b z-50 flex justify-between items-center transition-colors ${mode === 'velvet' ? 'bg-[#0a0a0a]/90 backdrop-blur-md border-white/5' : 'bg-white/90 backdrop-blur-md border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mode === 'velvet' ? 'bg-[#C6A649] text-black' : 'bg-blue-600 text-white'}`}><Play fill={mode === 'velvet' ? "black" : "white"} size={14} /></div>
          <span className={`text-sm font-bold tracking-[0.2em] ${mode === 'velvet' ? 'text-white' : 'text-gray-900'}`}>MivideoAI</span>
        </div>
        <div className="flex items-center gap-3">
          <button id="mobile-mode-toggle" onClick={handleModeToggle} className={`relative w-12 h-6 rounded-full border transition-all ${mode === 'velvet' ? 'bg-black border-white/20' : 'bg-gray-200 border-gray-300'}`}>
            <div className={`absolute top-0.5 bottom-0.5 w-5 rounded-full shadow-sm transition-transform duration-300 ${mode === 'velvet' ? 'translate-x-6 bg-[#C6A649]' : 'translate-x-0.5 bg-white'}`}></div>
          </button>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${mode === 'velvet' ? 'bg-white/10' : 'bg-gray-100'}`}>
            <span className={`text-xs font-bold ${mode === 'velvet' ? 'text-white' : 'text-gray-900'}`}>{userProfile?.is_admin ? '∞' : credits}</span>
            <Zap size={12} className={mode === 'velvet' ? 'text-[#C6A649] fill-[#C6A649]' : 'text-blue-500 fill-blue-500'} />
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileHeader;
