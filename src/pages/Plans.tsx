import React, { useState, useEffect } from 'react';
import { Star, Zap, Crown, Info } from 'lucide-react';
import { CheckoutModal } from '@/components/CheckoutModal';

export const Plans = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [currency, setCurrency] = useState<'USD' | 'ARS' | 'USDT'>('USD');
  const [dolarBlue, setDolarBlue] = useState<number>(1200);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: number; credits: number; tier: string; cycle: 'monthly' | 'yearly' } | null>(null);

  useEffect(() => {
    fetchDolarBlue();
  }, []);

  const fetchDolarBlue = async () => {
    try {
      const res = await fetch('https://api.bluelytics.com.ar/v2/latest');
      const data = await res.json();
      if (data?.blue?.value_avg) {
        setDolarBlue(data.blue.value_avg);
      }
    } catch (e) {
      console.error('Error fetching dolar blue', e);
    }
  };

  const plans = [
    {
      name: 'TALENT',
      descriptor: 'The Rising Star',
      price: 15,
      icon: <Star className="text-gray-400" />,
      features: [
        '1,200 Credits / month ($0.012/cr)',
        '~24 Draft Videos or 3 Cinematic Masters',
        'Standard Velocity',
        'Private Gallery',
        'Personal Brand License',
      ],
      credits: '1,200 CR',
      highlight: false,
      color: 'border-gray-500',
    },
    {
      name: 'PRODUCER',
      descriptor: 'The Professional',
      price: 40,
      icon: <Zap className="text-amber-400" />,
      features: [
        '3,500 Credits / month ($0.011/cr)',
        '~80 Draft Videos or 10 Cinematic Masters',
        'Priority Queue (Skip the Line)',
        'Watermark Removal',
        'Rollover Credits (2 months)',
        'Commercial License',
      ],
      credits: '4,000 CR', // Includes bonus visualization if we want
      notes: '+500 Bonus Credits',
      highlight: true,
      color: 'border-amber-500/50',
    },
    {
      name: 'MOGUL',
      descriptor: 'The Industry Titan',
      price: 100,
      icon: <Crown className="text-purple-400" />,
      features: [
        '10,000 Credits / month ($0.010/cr)',
        '~240 Draft Videos or 30 Cinematic Masters',
        'Concierge Support',
        'Early Access (Kling 3.0)',
        'API Access Keys',
        'Unlimited Rollover',
      ],
      credits: '12,000 CR',
      notes: '+2,000 Bonus Credits',
      highlight: false,
      color: 'border-purple-500/50',
    },
  ];

  const getPrice = (basePrice: number) => {
    let price = basePrice;
    if (billingCycle === 'yearly') {
      price = price * 0.8; // 20% Off
    }

    if (currency === 'ARS') return `$ ${(price * dolarBlue).toLocaleString('es-AR')}`;
    if (currency === 'USDT') return `${price.toFixed(2)} USDT`;
    return `$ ${price.toFixed(2)}`;
  };

  const creditAmounts: Record<string, number> = {
    TALENT: 1200,
    PRODUCER: 4000,
    MOGUL: 12000
  };

  const handleSubscribe = (planName: string, basePrice: number) => {
    let price = basePrice;
    if (billingCycle === 'yearly') price = price * 0.8;

    // For yearly, show total for 12 months
    const checkoutPrice = billingCycle === 'yearly' ? price * 12 : price;

    setSelectedPlan({
      name: planName,
      price: checkoutPrice,
      credits: creditAmounts[planName] || 1200,
      tier: planName.toLowerCase(),
      cycle: billingCycle
    });
    setCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 animate-fade-in pb-24 font-sans">
      <header className="text-center mb-16 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-900/20 blur-[100px] rounded-full -z-10" />

        <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tighter">MEMBERSHIP</h1>
        <p className="text-gray-400 text-lg md:text-xl font-light tracking-wide">
          Invest in your assets. Monetize your imagination.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-6 mt-12 bg-white/5 w-fit mx-auto px-6 py-2 rounded-full border border-white/10 backdrop-blur-sm">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`text-sm font-bold tracking-widest uppercase transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-500'}`}
          >
            Monthly
          </button>

          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="w-12 h-6 bg-white/10 rounded-full p-1 relative transition-colors hover:bg-white/20"
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-all shadow-lg ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`}
            />
          </button>

          <button
            onClick={() => setBillingCycle('yearly')}
            className={`text-sm font-bold tracking-widest uppercase transition-colors ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-500'}`}
          >
            Yearly <span className="text-emerald-400 text-[10px] ml-1 align-top">-20%</span>
          </button>
        </div>

        {/* Currency Selector */}
        <div className="flex justify-center gap-2 mt-6 opacity-60 hover:opacity-100 transition-opacity">
          {['USD', 'ARS', 'USDT'].map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c as 'USD' | 'ARS' | 'USDT')}
              className={`px-3 py-1 rounded text-[10px] font-bold border transition-colors ${currency === c ? 'bg-white text-black border-white' : 'text-gray-500 border-white/10 hover:border-white/30'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.name}
            onClick={() => handleSubscribe(plan.name, plan.price)}
            className={`relative p-8 rounded-3xl border flex flex-col group cursor-pointer transition-all duration-500 ${
              plan.highlight
                ? 'bg-[#0f0f0f] border-amber-500/30 md:-translate-y-4 shadow-2xl shadow-amber-900/10'
                : 'bg-black border-white/10 hover:border-white/30 hover:bg-[#0a0a0a]'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                Most Popular
              </div>
            )}

            <div className="mb-8">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:scale-110 transition-transform duration-500">
                  {plan.icon}
                </div>
                {plan.notes && (
                  <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">
                    {plan.notes}
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-bold mb-1 tracking-wide">{plan.name}</h3>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-6">
                {plan.descriptor}
              </p>

              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tighter text-white">
                  {getPrice(plan.price)}
                </span>
                <span className="text-gray-600 text-sm font-medium">/mo</span>
              </div>
              {billingCycle === 'yearly' && (
                <p className="text-xs text-gray-500 mt-2">
                  Billed {getPrice(plan.price * 12)} yearly
                </p>
              )}
            </div>

            {/* Credits Block */}
            <div className="bg-white/5 rounded-xl p-4 mb-8 border border-white/5 group-hover:border-white/10 transition-colors">
              <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                Monthly Allowance
              </div>
              <div className="text-2xl font-bold text-white flex items-center gap-2">
                {plan.credits}
                <Info
                  size={14}
                  className="text-gray-600 hover:text-white transition-colors cursor-help"
                />
              </div>
            </div>

            <ul className="flex-1 space-y-4 mb-8">
              {plan.features.map((feat) => (
                <li
                  key={feat}
                  className="flex items-center gap-3 text-sm text-gray-300 group-hover:text-white transition-colors"
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${plan.highlight ? 'bg-amber-500' : 'bg-gray-600 group-hover:bg-white'} transition-colors`}
                  />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-300 ${
                plan.highlight
                  ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_50px_rgba(245,158,11,0.4)]'
                  : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              Select {plan.name}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-24 text-center">
        <p className="text-gray-600 text-sm max-w-2xl mx-auto">
          MivideoAI uses a specialized credit system standardized to the cost of Hyper-Realistic
          Video Generation. Unused credits in Producer and Mogul tiers roll over for up to 60 days.
          <br />
          <br />
          {currency === 'ARS' && (
            <span className="text-emerald-600/50 block mt-2 text-xs font-mono">
              * Exchange Rate: 1 USD = {dolarBlue} ARS
            </span>
          )}
        </p>
      </div>

      {/* Checkout Modal */}
      {selectedPlan && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          planName={selectedPlan.name}
          creditAmount={selectedPlan.credits}
          priceUSD={selectedPlan.price}
          planTier={selectedPlan.tier}
          billingCycle={selectedPlan.cycle}
        />
      )}
    </div>
  );
};
