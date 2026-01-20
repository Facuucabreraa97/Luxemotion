import React from 'react';
import { DollarSign, TrendingUp, Package, Lock, BarChart3, ArrowRight } from 'lucide-react';
import { useMode } from '../context/ModeContext';
import { useTranslation } from 'react-i18next';
import { useEarnings } from '../hooks/useEarnings';
import { S } from '../styles';
import { useNavigate } from 'react-router-dom';

export const EarningsDashboard = () => {
    const { mode } = useMode();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { earnings, loading, stats } = useEarnings();
    const isVelvet = mode === 'velvet';

    if (loading) return <div className="p-12 text-center text-gray-500">Loading Dashboard...</div>;

    const cards = [
        { title: t('earnings.total_revenue'), value: `${stats.totalError} CR`, icon: DollarSign, color: isVelvet ? 'text-[#C6A649]' : 'text-green-600' },
        { title: t('earnings.assets_sold'), value: stats.count, icon: Package, color: isVelvet ? 'text-white' : 'text-blue-600' },
        { title: t('earnings.pipeline_value'), value: `${stats.royalties.toFixed(0)} CR`, icon: TrendingUp, color: isVelvet ? 'text-purple-400' : 'text-purple-600', sub: t('earnings.projected') }
    ];

    return (
        <div className={`p-6 lg:p-12 pb-32 animate-in fade-in slide-in-from-bottom-4`}>
            {/* Header */}
            <div className={`flex justify-between items-end border-b pb-8 mb-12 ${isVelvet ? 'border-white/10' : 'border-gray-200'}`}>
                <div>
                    <h2 className={`text-4xl font-bold uppercase tracking-[0.1em] ${isVelvet ? 'text-white' : 'text-gray-900'}`}>
                        {t('earnings.title')}
                    </h2>
                    <p className={isVelvet ? S.subLuxe : "text-[9px] text-blue-600 mt-2 uppercase tracking-[0.4em] font-bold"}>
                        {t('earnings.subtitle')}
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                {cards.map((c, i) => (
                    <div key={i} className={`p-8 rounded-[30px] relative overflow-hidden group hover:-translate-y-1 transition-all ${isVelvet ? S.panel : 'bg-white shadow-xl border border-gray-100'}`}>
                        <div className={`absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform ${c.color}`}>
                            <c.icon size={64} />
                        </div>
                        <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${isVelvet ? 'text-white/40' : 'text-gray-400'}`}>
                            {c.title}
                        </div>
                        <div className={`text-4xl font-bold tracking-tighter ${c.color}`}>
                            {c.value}
                        </div>
                        {c.sub && <div className="text-[10px] uppercase font-bold text-gray-400 mt-2">{c.sub}</div>}
                    </div>
                ))}
            </div>

            {/* Assets Grid */}
            <h3 className={`text-xl font-bold uppercase tracking-widest mb-8 ${isVelvet ? 'text-white' : 'text-gray-900'}`}>{t('earnings.portfolio')}</h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {earnings.map((item) => (
                    <div key={item.id} className={`group relative aspect-[9/16] rounded-[30px] overflow-hidden ${isVelvet ? 'bg-black/30' : 'bg-gray-100'} ${item.isExample ? 'border-2 border-dashed border-gray-500/30' : ''}`}>
                        <img src={item.image_url} className="w-full h-full object-cover grayscale opacity-60 group-hover:opacity-40 transition-all duration-500" />

                        {/* Status Badge */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                            <div className="bg-black/80 backdrop-blur text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-white/10 shadow-lg">
                                {t('earnings.sold')}
                            </div>
                            {item.isExample && <div className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-[8px] font-bold uppercase">{t('earnings.example')}</div>}
                        </div>

                        {/* Center Info */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                            <Lock size={24} className={isVelvet ? "text-[#C6A649]" : "text-gray-800"} />
                            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-2 ${isVelvet ? 'text-white' : 'text-gray-900'}`}>{t('earnings.locked')}</span>
                        </div>

                        {/* Bottom Stats */}
                        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                            <h4 className="text-white text-xs font-bold uppercase tracking-widest truncate mb-2">{item.name}</h4>
                            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mb-2">
                                <div className="h-full bg-[#C6A649] w-[75%] rounded-full shadow-[0_0_10px_#C6A649]"></div>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-bold uppercase text-white/60">
                                <span className="flex items-center gap-1"><BarChart3 size={10} /> {t('earnings.performance')}</span>
                                <span>High</span>
                            </div>
                        </div>
                    </div>
                ))}

                {earnings.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-20 h-20 bg-gray-100/10 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-500">
                            <Package size={32} />
                        </div>
                        <h3 className={`text-xl font-bold uppercase tracking-widest mb-2 ${isVelvet ? 'text-white' : 'text-gray-900'}`}>{t('earnings.empty_title')}</h3>
                        <p className="text-xs text-gray-500 max-w-md mx-auto mb-8">{t('earnings.empty_desc')}</p>
                        <button onClick={() => navigate('/app/talent')} className={`px-8 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all ${isVelvet ? S.btnGold : 'bg-black text-white hover:bg-gray-800'}`}>
                            {t('earnings.go_casting')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
