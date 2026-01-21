import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Users, Shield, DollarSign, Activity, Search, Ban, CheckCircle, Edit, Zap, RotateCw } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = 'dmsfak@proton.me';

// Helper: Skeleton
const SkeletonRow = () => (
    <div className="flex items-center gap-4 p-4 border-b border-white/5 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-slate-800"></div>
        <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-800 rounded w-1/3"></div>
            <div className="h-2 bg-slate-800 rounded w-1/4"></div>
        </div>
        <div className="h-4 bg-slate-800 rounded w-16"></div>
        <div className="h-4 bg-slate-800 rounded w-10"></div>
    </div>
);

// Helper: Avatar
const SmartAvatar = ({ url, name }: { url?: string, name: string }) => {
    if (url) return <img src={url} className="w-full h-full object-cover" />;
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold text-slate-400">{initials}</div>;
};

export const AdminConsole = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'users' | 'treasury'>('users');

    // Data States
    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Auth Check
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || user.email !== ADMIN_EMAIL) {
                navigate('/');
                return;
            }
            fetchData();
        };
        init();
    }, []);

    const fetchData = async () => {
        setRefreshing(true);
        setErrorMsg(null);

        // SIMPLIFIED QUERY (No Order to avoid 400)
        const { data, error } = await supabase.from('profiles').select('*');

        if (error) {
            console.error("Admin Fetch Error:", error);
            setErrorMsg(error.message);
            setLoading(false);
        } else if (data) {
            // Client Side Sort
            const sorted = data.sort((a: any, b: any) =>
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            );
            setUsers(sorted);
            setLoading(false);
        }
        setRefreshing(false);
    };

    // --- REAL TIME KPIs ---
    const kpi = useMemo(() => {
        const totalUsers = users.length;
        const pending = users.filter(u => u.access_status === 'pending').length;
        const globalTreasury = users.reduce((acc, curr) => acc + (curr.credits || 0), 0);
        return { totalUsers, pending, globalTreasury };
    }, [users]);

    // Actions
    const handleStatus = async (id: string, status: string) => {
        // Optimistic UI
        setUsers(prev => prev.map(u => u.id === id ? { ...u, access_status: status } : u));

        const { error } = await supabase.from('profiles').update({ access_status: status }).eq('id', id);
        if (error) {
            alert('Error sync: ' + error.message);
            fetchData(); // Rollback/Re-fetch
        }
    };

    const handleAddCredits = async (id: string, current: number) => {
        const amount = prompt("INJECT AMOUNT (CR):");
        if (!amount) return;
        const val = parseInt(amount);
        if (isNaN(val)) return;

        // Optimistic
        setUsers(prev => prev.map(u => u.id === id ? { ...u, credits: (u.credits || 0) + val } : u));

        const { error } = await supabase.from('profiles').update({ credits: current + val }).eq('id', id);
        if (error) {
            alert('Error: ' + error.message);
            fetchData();
        }
    };

    const filteredUsers = users.filter(u => {
        const search = searchTerm.toLowerCase();
        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase(); // If email isn't in profile, we might miss it. Check DB schema. 
        // Assuming email IS in profiles based on prompt "Columnas: ... Email". 
        // If it's not, we only search name.
        return fullName.includes(search) || u.id.includes(search) || email.includes(search);
    });

    if (loading) return (
        <div className="min-h-screen bg-slate-950 p-8 pt-20">
            {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
        </div>
    );

    if (errorMsg) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-red-500 font-mono">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold uppercase tracking-widest mb-2">System Critical Error</h1>
            <p className="bg-red-500/10 border border-red-500/20 p-4 rounded text-sm max-w-2xl">
                {errorMsg}
            </p>
            <button onClick={fetchData} className="mt-8 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded uppercase tracking-widest font-bold text-xs transition-colors">
                Retry Protocol
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-100">

            {/* TOP BAR */}
            <header className="border-b border-white/5 bg-slate-950/80 flex items-center justify-between px-6 py-4 sticky top-0 z-50 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyan-900 to-slate-800 flex items-center justify-center border border-white/10">
                        <Shield className="text-cyan-400 w-4 h-4" />
                    </div>
                    <span className="font-bold tracking-[0.2em] text-xs text-white uppercase">VydyLabs OS <span className="text-slate-600">//</span> Admin</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchData} className={`p-2 rounded-full hover:bg-white/5 transition-colors ${refreshing ? 'animate-spin text-cyan-500' : 'text-slate-500'}`}>
                        <RotateCw size={16} />
                    </button>
                    <div className="text-[10px] text-slate-600 bg-white/5 px-2 py-1 rounded font-mono">{ADMIN_EMAIL}</div>
                </div>
            </header>

            <main className="p-6 md:p-8 max-w-[1800px] mx-auto space-y-8">

                {/* KPI GRID (Glassmorphism) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative overflow-hidden p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md group hover:border-cyan-500/30 transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Users size={40} /></div>
                        <div className="text-sm font-medium text-slate-400 mb-1 uppercase tracking-wider">Total Users</div>
                        <div className="text-4xl font-bold text-white font-mono">{kpi.totalUsers}</div>
                    </div>
                    <div className="relative overflow-hidden p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md group hover:border-orange-500/30 transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Activity size={40} /></div>
                        <div className="text-sm font-medium text-slate-400 mb-1 uppercase tracking-wider">Pending Approval</div>
                        <div className="text-4xl font-bold text-orange-400 font-mono">{kpi.pending}</div>
                    </div>
                    <div className="relative overflow-hidden p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md group hover:border-emerald-500/30 transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign size={40} /></div>
                        <div className="text-sm font-medium text-slate-400 mb-1 uppercase tracking-wider">Global Treasury (CR)</div>
                        <div className="text-4xl font-bold text-emerald-400 font-mono">{kpi.globalTreasury.toLocaleString()}</div>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex items-center gap-6 border-b border-white/5">
                    <button onClick={() => setActiveTab('users')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'users' ? 'text-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}>
                        Users Database
                        {activeTab === 'users' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>}
                    </button>
                    <button onClick={() => setActiveTab('treasury')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'treasury' ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}>
                        Treasury Logs
                        {activeTab === 'treasury' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>}
                    </button>
                </div>

                {/* CONTENT AREA */}
                {activeTab === 'users' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* CONTROLS */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="relative w-full max-w-md group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-cyan-500 transition-colors" />
                                <input
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Search by ID, Name or Email..."
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none focus:border-cyan-500/50 focus:bg-cyan-900/5 transition-all placeholder:text-slate-700"
                                />
                            </div>
                        </div>

                        {/* TABLE GRID */}
                        <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.02] backdrop-blur-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-black/40 text-[10px] font-bold text-slate-500 uppercase tracking-widest backdrop-blur-md sticky top-0 z-10">
                                        <tr>
                                            <th className="p-4 w-16 text-center">Identity</th>
                                            <th className="p-4">User Details</th>
                                            <th className="p-4">Access Status</th>
                                            <th className="p-4">Treasury (CR)</th>
                                            <th className="p-4 text-right">Protocol</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-sm">
                                        {filteredUsers.length === 0 ? (
                                            <tr><td colSpan={5} className="p-8 text-center text-slate-600 font-mono text-xs">NO_DATA_MATCHING_QUERY_VECTOR</td></tr>
                                        ) : filteredUsers.map(user => (
                                            <tr key={user.id} className="group hover:bg-cyan-500/5 transition-colors duration-200">
                                                <td className="p-4">
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-lg group-hover:scale-110 transition-transform">
                                                        <SmartAvatar url={user.avatar_url} name={`${user.first_name} ${user.last_name}`} />
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-white font-bold mb-0.5">{user.first_name} {user.last_name}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{user.email || 'NO_EMAIL_LINKED'}</div>
                                                    <div className="text-[9px] text-slate-700 font-mono mt-1 pt-1 border-t border-white/5 truncate max-w-[150px] opacity-0 group-hover:opacity-100 transition-opacity">ID: {user.id}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${user.access_status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                        user.access_status === 'banned' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                            'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                        }`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${user.access_status === 'approved' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' :
                                                            user.access_status === 'banned' ? 'bg-red-400' : 'bg-orange-400 animate-pulse'
                                                            }`}></div>
                                                        {user.access_status || 'PENDING'}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-mono text-slate-300 group-hover:text-cyan-300 transition-colors">
                                                        {user.credits?.toLocaleString() || 0} <span className="text-[10px] text-slate-600">CR</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                                                        <button onClick={() => handleAddCredits(user.id, user.credits || 0)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 border border-white/5 transition-all" title="Inject Liquidity"><Zap size={14} /></button>
                                                        {user.access_status !== 'approved' && <button onClick={() => handleStatus(user.id, 'approved')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 transition-all" title="Approve Protocol"><CheckCircle size={14} /></button>}
                                                        {user.access_status !== 'banned' && <button onClick={() => handleStatus(user.id, 'banned')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/5 transition-all" title="Ban Entity"><Ban size={14} /></button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
