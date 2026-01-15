import React, { useState } from 'react';
import { CreditCard, Bitcoin, Shield, X } from 'lucide-react';
import { PRICING } from '../constants';
import { S } from '../styles';
import { CONFIG } from '../config';
import { useMode } from '../context/ModeContext';
import { useTranslation } from 'react-i18next';

export const CheckoutModal = ({ planKey, annual, onClose }: { planKey: string, annual: boolean, onClose: () => void }) => {
  const { mode } = useMode();
  const { t } = useTranslation();
  const p = PRICING[planKey as keyof typeof PRICING];
  const [proc, setProc] = useState(false);
  const [currency, setCurrency] = useState<'USD'|'ARS'>('USD');
  const [method, setMethod] = useState<'card'|'crypto'>('card');
  const finalPrice = annual && (p as any).yearlyPrice ? (p as any).yearlyPrice : p.price;
  const displayPrice = currency === 'ARS' ? finalPrice * 1150 : finalPrice;

  const handlePay = async () => {
      setProc(true);
      try {
          const r = await fetch(`${CONFIG.API_URL}/create-preference`, {
              method: 'POST', headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ title: `Plan ${p.name}`, price: displayPrice, quantity: 1, currency })
          });
          const d = await r.json();
          if (d.url) window.location.href = d.url;
          else throw new Error(t('common.error'));
      } catch(e) { alert(t('auth.connection_error')); setProc(false); }
  };

  // Adaptive Styles
  const panelClass = mode === 'velvet'
    ? S.panel
    : 'bg-white border border-gray-200 shadow-2xl text-black';

  const textPrimary = mode === 'velvet' ? 'text-white' : 'text-black';
  const textSecondary = mode === 'velvet' ? 'text-white/50' : 'text-gray-700';
  const textAccent = mode === 'velvet' ? 'text-[#C6A649]' : 'text-blue-600';
  const closeBtn = mode === 'velvet' ? 'text-white/30 hover:text-white' : 'text-gray-400 hover:text-black';
  const summaryBox = mode === 'velvet' ? 'bg-white/5' : 'bg-gray-50 border border-gray-100';
  const summaryText = mode === 'velvet' ? 'text-white/80' : 'text-gray-700';
  const methodActive = mode === 'velvet' ? 'border-[#C6A649] bg-[#C6A649]/10 text-[#C6A649]' : 'border-blue-600 bg-blue-50 text-blue-700';
  const methodInactive = mode === 'velvet' ? 'border-white/10 text-white/40' : 'border-gray-200 text-gray-400 hover:border-gray-300';
  const currencyActive = mode === 'velvet' ? 'bg-[#C6A649] text-black' : 'bg-black text-white';
  const currencyInactive = mode === 'velvet' ? 'text-gray-500' : 'text-gray-400 hover:bg-white/50';
  const divider = mode === 'velvet' ? 'border-white/10' : 'border-gray-200';
  const totalLabel = mode === 'velvet' ? 'text-white/40' : 'text-gray-600';
  const priceColor = mode === 'velvet' ? 'text-white' : 'text-black';

  // Button Style Override for Agency Mode
  const actionBtn = mode === 'velvet'
    ? S.btnGold
    : 'bg-black text-white font-bold uppercase tracking-[0.2em] shadow-lg hover:bg-gray-800 hover:shadow-xl active:scale-95 transition-all duration-300 rounded-xl cursor-pointer';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className={`w-full max-w-md p-8 rounded-[40px] text-center relative transition-colors duration-300 ${panelClass}`}>
        <button onClick={onClose} className={`absolute top-6 right-6 ${closeBtn}`}><X size={20}/></button>
        <h3 className={`${textPrimary} font-bold uppercase tracking-[0.3em] mb-2 text-sm`}>{t('billing.checkout.title')}</h3>
        <p className={`${textAccent} text-xs font-bold uppercase tracking-widest mb-6`}>{p.name} {annual ? `(${t('billing.annual')})` : `(${t('billing.monthly')})`}</p>

        <div className={`${summaryBox} p-4 rounded-xl mb-6 text-left`}>
            <p className={`text-[10px] ${textSecondary} uppercase mb-2 font-bold`}>{t('billing.checkout.summary_title')}</p>
            <ul className={`text-xs ${summaryText} space-y-1`}>
                <li>• {t('billing.checkout.access', { credits: p.creds })}</li>
                <li>• {t('billing.checkout.unlock', { plan: p.name === 'Influencer' ? 'Velvet' : 'Pro' })}</li>
                <li>• {t('billing.checkout.cancel')}</li>
            </ul>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={()=>setMethod('card')} className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${method==='card' ? methodActive : methodInactive}`}>
                <CreditCard size={14}/><span className="text-[10px] font-bold">{t('billing.pay_card')}</span>
            </button>
            <button onClick={()=>setMethod('crypto')} className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${method==='crypto' ? methodActive : methodInactive}`}>
                <Bitcoin size={14}/><span className="text-[10px] font-bold">USDT</span>
            </button>
        </div>

        <div className={`flex gap-2 mb-6 p-1 rounded-xl ${mode==='velvet'?'bg-black/30':'bg-gray-100'}`}>
            <button onClick={()=>setCurrency('USD')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${currency==='USD' ? currencyActive : currencyInactive}`}>USD / USDT</button>
            <button onClick={()=>setCurrency('ARS')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${currency==='ARS' ? currencyActive : currencyInactive}`}>Pesos ARS</button>
        </div>

        <div className={`flex justify-between items-end py-4 border-t ${divider} mb-6`}>
            <div className="text-left"><span className={`block ${totalLabel} text-[10px] uppercase font-bold tracking-widest`}>{t('billing.checkout.total')}</span><span className={`text-[9px] ${textAccent}`}>{t('billing.checkout.vat_included')}</span></div>
            <span className={`text-3xl font-bold ${priceColor} tracking-tighter`}>{currency === 'USD' ? '$' : '$'}{displayPrice.toLocaleString()}</span>
        </div>
        <button onClick={handlePay} disabled={proc} className={`w-full py-4 rounded-2xl text-xs ${actionBtn}`}>{proc ? t('common.processing') : t('billing.checkout.confirm_pay')}</button>
        <p className={`text-[8px] ${textSecondary} mt-4 flex items-center justify-center gap-1`}><Shield size={8}/> {t('billing.checkout.secure')}</p>

        <div className={`mt-6 border-t ${divider} pt-4`}>
           <details className="group">
              <summary className={`list-none text-[8px] ${textSecondary} uppercase tracking-widest cursor-pointer hover:opacity-100 transition-opacity flex items-center justify-center gap-2 opacity-70`}>
                 {t('billing.terms_title')} <span className="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className={`text-[9px] ${textSecondary} mt-3 leading-relaxed px-4 opacity-80`}>
                 {t('billing.terms_text')}
              </p>
           </details>
        </div>
      </div>
    </div>
  );
};
