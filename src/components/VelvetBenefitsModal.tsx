import React from 'react';
import { LockOpen, Check, X } from 'lucide-react';
import { S } from '../styles';

interface VelvetBenefitsModalProps {
  onClose: () => void;
  onUnlock: () => void;
}

export const VelvetBenefitsModal: React.FC<VelvetBenefitsModalProps> = ({ onClose, onUnlock }) => {
  const benefits = [
    'Uncensored',
    'Hyperrealistic Skin (8K)',
    'Exclusive Models',
    'Priority Generation'
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-in zoom-in duration-300">
      <div className="w-full max-w-sm relative group">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-900 opacity-40 blur-2xl rounded-[40px]"></div>

        <div className="bg-[#050505] relative rounded-[32px] p-8 text-center border border-pink-500/20 shadow-2xl overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors z-10"
          >
            <X size={20} />
          </button>

          {/* Animated Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-tr from-pink-600 to-purple-900 rounded-full flex items-center justify-center border border-pink-500/50 shadow-[0_0_30px_rgba(236,72,153,0.3)] animate-pulse relative z-10">
            <LockOpen size={32} className="text-white fill-white/20" />
          </div>

          {/* Titles */}
          <h2 className="text-sm font-bold text-white/70 uppercase tracking-[0.2em] mb-1 relative z-10">Enter the</h2>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400 uppercase tracking-[0.2em] mb-8 relative z-10 drop-shadow-sm">
            Velvet Side
          </h2>

          {/* Benefits List */}
          <div className="space-y-4 mb-8 text-left pl-6 relative z-10">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-4 group/item">
                <div className="p-1 rounded-full bg-gradient-to-br from-[#C6A649] to-[#FCD34D] text-black shadow-[0_0_10px_rgba(198,166,73,0.3)]">
                   <Check size={12} strokeWidth={4} />
                </div>
                <span className="text-sm font-medium text-gray-300 tracking-wide group-hover/item:text-white transition-colors">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={onUnlock}
            className={`w-full py-4 text-sm ${S.btnVelvet} relative z-10 shadow-[0_0_20px_rgba(236,72,153,0.5)]`}
          >
            UNLOCK FULL ACCESS
          </button>
        </div>
      </div>
    </div>
  );
};
