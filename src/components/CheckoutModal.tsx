import React, { useState } from 'react';
import { CreditCard, Bitcoin, Shield, X } from 'lucide-react';
import { PRICING } from '../constants';
import { S } from '../styles';
import { CONFIG } from '../config';

export const CheckoutModal = ({ planKey, annual, onClose }: { planKey: string, annual: boolean, onClose: () => void }) => {
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
          else throw new Error("Error en pago");
      } catch(e) { alert("Error de conexión"); setProc(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in">
      <div className={`w-full max-w-md p-8 rounded-[40px] text-center relative ${S.panel}`}>
        <button onClick={onClose} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={20}/></button>
        <h3 className="text-white font-bold uppercase tracking-[0.3em] mb-2 text-sm">Checkout</h3>
        <p className="text-[#C6A649] text-xs font-bold uppercase tracking-widest mb-6">{p.name} {annual ? '(Anual)' : '(Mensual)'}</p>

        <div className="bg-white/5 p-4 rounded-xl mb-6 text-left">
            <p className="text-[10px] text-white/50 uppercase mb-2 font-bold">Resumen:</p>
            <ul className="text-xs text-white/80 space-y-1">
                <li>• Acceso inmediato a {p.creds} créditos</li>
                <li>• Desbloqueo de funciones {p.name === 'Influencer' ? 'Velvet' : 'Pro'}</li>
                <li>• Cancelación en cualquier momento</li>
            </ul>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={()=>setMethod('card')} className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${method==='card' ? 'border-[#C6A649] bg-[#C6A649]/10 text-[#C6A649]' : 'border-white/10 text-white/40'}`}>
                <CreditCard size={14}/><span className="text-[10px] font-bold">Tarjeta</span>
            </button>
            <button onClick={()=>setMethod('crypto')} className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${method==='crypto' ? 'border-[#C6A649] bg-[#C6A649]/10 text-[#C6A649]' : 'border-white/10 text-white/40'}`}>
                <Bitcoin size={14}/><span className="text-[10px] font-bold">Cripto (USDT)</span>
            </button>
        </div>

        <div className="flex gap-2 mb-6 bg-black/30 p-1 rounded-xl">
            <button onClick={()=>setCurrency('USD')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase ${currency==='USD' ? 'bg-[#C6A649] text-black' : 'text-gray-500'}`}>USD / USDT</button>
            <button onClick={()=>setCurrency('ARS')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase ${currency==='ARS' ? 'bg-[#C6A649] text-black' : 'text-gray-500'}`}>Pesos ARS</button>
        </div>

        <div className="flex justify-between items-end py-4 border-t border-white/10 mb-6">
            <div className="text-left"><span className="block text-white/40 text-[10px] uppercase font-bold tracking-widest">Total</span><span className="text-[9px] text-[#C6A649]">IVA Incluido</span></div>
            <span className="text-3xl font-bold text-white tracking-tighter">{currency === 'USD' ? '$' : '$'}{displayPrice.toLocaleString()}</span>
        </div>
        <button onClick={handlePay} disabled={proc} className={`w-full py-4 rounded-2xl text-xs ${S.btnGold}`}>{proc ? "Procesando..." : "Confirmar y Pagar"}</button>
        <p className="text-[8px] text-white/20 mt-4 flex items-center justify-center gap-1"><Shield size={8}/> Pagos procesados de forma segura. Al continuar aceptas los términos.</p>
      </div>
    </div>
  );
};
