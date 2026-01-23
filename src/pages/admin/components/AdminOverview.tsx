import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, DollarSign, Activity, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { supabase } from '@/lib/supabase';

const DATA_GROWTH = Array.from({ length: 7 }).map((_, i) => ({
    name: format(subDays(new Date(), 6 - i), 'MMM dd'),
    value: Math.floor(Math.random() * 100) + 50 + (i * 20),
}));

const DATA_CREDITS = Array.from({ length: 7 }).map((_, i) => ({
    name: format(subDays(new Date(), 6 - i), 'dd'),
    in: Math.floor(Math.random() * 5000),
    out: Math.floor(Math.random() * 3000),
}));

export default function AdminOverview() {
    const [metrics, setMetrics] = useState({ users: 0, credits: 0, revenue: 0 });
    const [activeUsers, setActiveUsers] = useState(14);
    const [dateRange, setDateRange] = useState('Week');

    useEffect(() => {
        // Fetch real metrics
        async function fetchMetrics() {
            // Count users
            const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

            // Sum credits (mock logic or rpc if available, doing client side for now as simpler)
            const { data: profiles } = await supabase.from('profiles').select('credits');
            const totalCredits = profiles?.reduce((sum, p) => sum + (p.credits || 0), 0) || 0;

            // Mock Revenue
            setMetrics({ users: userCount || 0, credits: totalCredits, revenue: 12450 });
        }
        fetchMetrics();

        // Pulse Active Users
        const interval = setInterval(() => {
            setActiveUsers(prev => prev + (Math.random() > 0.5 ? 1 : -1));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full flex flex-col space-y-6 pt-6 px-6 pb-6 overflow-y-auto">
            {/* TOP BAR */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold tracking-widest text-[#E5E5E5]">COMMAND CENTER</h2>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">System Status: Nominal</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-black/40 border border-white/10 rounded-lg p-1">
                        {['Day', 'Week', 'Month'].map(r => (
                            <button key={r} onClick={() => setDateRange(r)} className={`px-4 py-1.5 text-[10px] uppercase font-bold rounded-md transition-all ${dateRange === r ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                                {r}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
                        <span className="text-xs font-mono text-green-500 font-bold">{activeUsers} ACTIVE</span>
                    </div>
                </div>
            </div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1 */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Users size={64} className="text-[#D4AF37]" /></div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]"><Users size={16} /></div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Total Users</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{metrics.users}</div>
                    <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold"><ArrowUpRight size={10} /> +12% this week</div>
                </div>

                {/* Card 2 */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Activity size={64} className="text-[#D4AF37]" /></div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]"><Activity size={16} /></div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Credits Circulation</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{metrics.credits.toLocaleString()}</div>
                    <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold"><ArrowUpRight size={10} /> High demand</div>
                </div>

                {/* Card 3 */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><DollarSign size={64} className="text-[#D4AF37]" /></div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]"><DollarSign size={16} /></div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Est. Revenue</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">${metrics.revenue.toLocaleString()}</div>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold">Stable trajectory</div>
                </div>
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[300px]">
                {/* Growth Chart */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">User Acquisition Vector</h3>
                    <div className="flex-1 w-full min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={DATA_GROWTH}>
                                <defs>
                                    <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#D4AF37', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#D4AF37" fillOpacity={1} fill="url(#colorGold)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Credit Flow Chart */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">Credit Liquidity (In/Out)</h3>
                    <div className="flex-1 w-full min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={DATA_CREDITS}>
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                />
                                <Bar dataKey="in" fill="#22c55e" radius={[4, 4, 0, 0]} stackId="a" />
                                <Bar dataKey="out" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
