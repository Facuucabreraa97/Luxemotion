import React, { useState, useEffect } from 'react';
import { Check, Zap, Globe, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const Plans = () => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
    const [currency, setCurrency] = useState<'USD' | 'ARS' | 'USDT'>('USD');
    const [dolarBlue, setDolarBlue] = useState<number>(1200); // Fallback
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

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
            console.error("Error fetching dolar blue", e);
        }
    };

    const plans = [
        {
            name: "Starter",
            price: 0,
            features: ["100 Credits / month", "Standard Generation", "Public Gallery", "Personal License"],
            highlight: false
        },
        {
            name: "Pro Creator",
            price: 29, // USD
            features: ["1,000 Credits / month", "Fast Generation", "Private Gallery", "Commercial License", "Priority Support"],
            highlight: true
        },
        {
            name: "Studio",
            price: 99, // USD
            features: ["5,000 Credits / month", "Turbo Generation", "API Access", "Reselling Rights", "Dedicated Manager"],
            highlight: false
        }
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

    const handleSubscribe = (planName: string) => {
        alert(`Subscription to ${planName} (${currency}) coming soon! Integrated with payment gateway.`);
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 animate-fade-in pb-24">
            <header className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display">Upgrade your Vision</h1>
                <p className="text-gray-400 text-lg">Choose the plan that fits your creative scale.</p>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 mt-8">
                    <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
                    <button
                        onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                        className="w-14 h-8 bg-white/10 rounded-full p-1 relative transition-colors hover:bg-white/20"
                    >
                        <div className={`w-6 h-6 bg-white rounded-full absolute transition-all ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-sm font-bold ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-500'}`}>
                        Yearly <span className="text-emerald-400 text-xs ml-1">(20% Off)</span>
                    </span>
                </div>

                {/* Currency Selector */}
                <div className="flex justify-center gap-2 mt-6">
                    {['USD', 'ARS', 'USDT'].map(c => (
                        <button
                            key={c}
                            onClick={() => setCurrency(c as any)}
                            className={`px-3 py-1 rounded text-xs font-bold border ${currency === c ? 'bg-white text-black border-white' : 'text-gray-500 border-white/10'}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <div
                        key={plan.name}
                        className={`relative p-8 rounded-3xl border flex flex-col ${plan.highlight
                                ? 'bg-[#111] border-indigo-500/50 shadow-2xl shadow-indigo-500/10 scale-105 z-10'
                                : 'bg-black border-white/10 hover:border-white/30'
                            } transition-all duration-300`}
                    >
                        {plan.highlight && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                                Most Popular
                            </div>
                        )}

                        <div className="mb-8">
                            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold tracking-tight">{getPrice(plan.price)}</span>
                                <span className="text-gray-500 text-sm">/mo</span>
                            </div>
                            {billingCycle === 'yearly' && plan.price > 0 && (
                                <p className="text-xs text-emerald-400 mt-2 font-bold">Billed yearly (Save 20%)</p>
                            )}
                        </div>

                        <ul className="flex-1 space-y-4 mb-8">
                            {plan.features.map(feat => (
                                <li key={feat} className="flex items-start gap-3 text-sm text-gray-300">
                                    <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                                    <span>{feat}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleSubscribe(plan.name)}
                            className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all ${plan.highlight
                                    ? 'bg-white text-black hover:scale-105 shadow-lg'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            {plan.price === 0 ? 'Current Plan' : 'Subscribe Now'}
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-16 text-center text-xs text-gray-600">
                {currency === 'ARS' && `*Conversion Rate: 1 USD = ${dolarBlue} ARS (Blue Average)`}
                <br />
                Payments are secure and encrypted.
            </div>
        </div>
    );
};
