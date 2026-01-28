import React from 'react';
import { Wallet, AlertTriangle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WalletDisplayProps {
  balance: number | null;
  isLoading: boolean;
  requiredCost: number;
}

export const WalletDisplay: React.FC<WalletDisplayProps> = ({
  balance,
  isLoading,
  requiredCost,
}) => {
  const isLowBalance = balance !== null && balance < requiredCost;

  // Format numbers for clean display
  const formattedBalance = balance !== null ? balance.toLocaleString() : '---';

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-300 animate-fade-in
      ${
        isLowBalance
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-[#111] border-white/5 hover:border-white/10 shadow-xl'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-lg ${isLowBalance ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}
          >
            <Wallet size={16} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Available Credits
          </span>
        </div>

        {/* Add Credits Button (Small) */}
        {!isLoading && (
          <Link
            to="/app/billing"
            className="flex items-center gap-1 text-[10px] font-bold uppercase bg-white/10 hover:bg-white text-white hover:text-black px-2 py-1 rounded-full transition-colors"
            title="Get More Credits"
          >
            <Plus size={10} /> Add
          </Link>
        )}
      </div>

      <div className="flex items-end gap-2">
        <h3
          className={`text-3xl font-display font-bold tracking-tight
           ${isLoading ? 'animate-pulse text-gray-600' : isLowBalance ? 'text-red-500' : 'text-white'}
        `}
        >
          {isLoading ? '...' : formattedBalance}
        </h3>
        <span className="text-xs font-bold text-gray-500 mb-1">CR</span>
      </div>

      {/* Logic-based Message */}
      {isLowBalance && !isLoading && (
        <div className="mt-3 flex items-start gap-2 text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-bold uppercase leading-tight">Insufficient Funds</p>
            <p className="text-[10px] opacity-80 mt-0.5">
              This generation requires {requiredCost} CR.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
