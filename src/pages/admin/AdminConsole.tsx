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
    const [transactions, setTransactions] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
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

        // 1. Users
        const { data: userData, error: userError } = await supabase.from('profiles').select('*');
        if (userError) setErrorMsg(userError.message);
        else if (userData) {
            setUsers(userData.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()));
        }

        // 2. Transactions (Treasury)
        if (activeTab === 'treasury') {
            const { data: txData, error: txError } = await supabase.from('transactions').select('*, profiles(first_name, last_name, email)').order('created_at', { ascending: false });
            if (txData) setTransactions(txData);
        }

        setLoading(false);
        setRefreshing(false);
    };

    // Refresh when tab changes
    useEffect(() => {
        if (activeTab === 'treasury') fetchData();
    }, [activeTab]);

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

    // RPC ACTION
    const handleAddCredits = async (id: string, current: number) => {
        const amountStr = prompt("INJECT AMOUNT (CR): (Positive=Deposit, Negative=Deduct)");
        if (!amountStr) return;
        const amount = parseInt(amountStr);
        if (isNaN(amount)) return;

        const reason = prompt("REASON FOR INJECTION:", "Admin Grant") || "Admin Grant";

        // Optimistic UI (Profiles only, Tx won't show until refresh unless we fake it)
        setUsers(prev => prev.map(u => u.id === id ? { ...u, credits: (u.credits || 0) + amount } : u));

        // ATOMIC RPC CALL
        const { error } = await supabase.rpc('add_credits', {
            target_user_id: id,
            credit_amount: amount,
            reason: reason
        });

        if (error) {
            alert('Atomic Transaction Failed: ' + error.message);
            fetchData(); // Rollback
        } else {
            // Success - if we were on treasury tab, we'd want to refresh
            if (activeTab === 'treasury') fetchData();
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
                <div onClick={fetchData} className="flex items-center gap-4 cursor-pointer group hover:opacity-80 transition-opacity" title="Soft Refresh Data">
                    <img src="/branding/vydylabs-logo-white.png" alt="VydyLabs OS" className="h-8 w-auto object-contain" />
                    <div className="h-6 w-px bg-white/10 mx-2"></div>
                    <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                        Admin Console
                    </span>
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
                                            <tr key={user.id} onClick={() => setSelectedUser(user)} className="group hover:bg-cyan-500/5 transition-colors duration-200 cursor-pointer">
                                                <td className="p-4">
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-lg group-hover:scale-110 transition-transform">
                                                        <SmartAvatar url={user.avatar_url} name={`${user.first_name} ${user.last_name}`} />
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-white font-bold mb-0.5">{user.first_name} {user.last_name}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{user.email || 'NO_EMAIL_LINKED'}</div>
                                                    <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {user.country && <span className="text-[9px] bg-slate-800 px-1 rounded text-slate-300 border border-slate-700">{user.country}</span>}
                                                        <span className="text-[9px] text-slate-600 font-mono">ID: {user.id.slice(0, 8)}...</span>
                                                    </div>
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
                                                        <button onClick={(e) => { e.stopPropagation(); handleAddCredits(user.id, user.credits || 0); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 border border-white/5 transition-all" title="Inject Liquidity"><Zap size={14} /></button>
                                                        {user.access_status !== 'approved' && <button onClick={(e) => { e.stopPropagation(); handleStatus(user.id, 'approved'); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 transition-all" title="Approve Protocol"><CheckCircle size={14} /></button>}
                                                        {user.access_status !== 'banned' && <button onClick={(e) => { e.stopPropagation(); handleStatus(user.id, 'banned'); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/5 transition-all" title="Ban Entity"><Ban size={14} /></button>}
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

                {/* LEDGER / TREASURY TAB */}
                {activeTab === 'treasury' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-2">
                                <DollarSign className="text-emerald-400" /> Global Ledger
                            </h2>
                            <button onClick={fetchData} className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20 text-xs font-bold uppercase tracking-wider">Sync Blockchain</button>
                        </div>

                        <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.02] backdrop-blur-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-black/40 text-[10px] font-bold text-slate-500 uppercase tracking-widest backdrop-blur-md sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4">Time (UTC)</th>
                                        <th className="p-4">Transaction ID</th>
                                        <th className="p-4">Beneficiary</th>
                                        <th className="p-4">Description</th>
                                        <th className="p-4 text-right">Amount (CR)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm font-mono">
                                    {transactions.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-600">LEDGER_EMPTY // GENESIS_BLOCK_WAITING</td></tr>
                                    ) : transactions.map(tx => (
                                        <tr key={tx.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-slate-500 whitespace-nowrap">{new Date(tx.created_at).toLocaleString()}</td>
                                            <td className="p-4 text-slate-600 text-[10px]">{tx.id}</td>
                                            <td className="p-4 text-slate-300">
                                                {tx.profiles ? (
                                                    <div className="flex items-center gap-2">
                                                        <span>{tx.profiles.first_name} {tx.profiles.last_name}</span>
                                                        <span className="text-slate-600 text-[10px]">({tx.profiles.email})</span>
                                                    </div>
                                                ) : <span className="text-slate-700">UNKNOWN_ENTITY</span>}
                                            </td>
                                            <td className="p-4 text-xs text-slate-400 uppercase tracking-wider">{tx.type} // {tx.description}</td>
                                            <td className={`p-4 text-right font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* USER DETAIL MODAL */}
                {selectedUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedUser(null)}>
                        <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className="p-6 border-b border-white/5 bg-slate-900/50 flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                                        <SmartAvatar url={selectedUser.avatar_url} name={`${selectedUser.first_name} ${selectedUser.last_name}`} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">{selectedUser.first_name} {selectedUser.last_name}</h2>
                                        <div className="text-xs text-slate-400 font-mono">{selectedUser.email}</div>
                                        <div className="mt-2 flex gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${selectedUser.access_status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                selectedUser.access_status === 'banned' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                }`}>{selectedUser.access_status || 'PENDING'}</span>
                                            {selectedUser.email === ADMIN_EMAIL && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">ADMIN</span>}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-white transition-colors"><Zap className="rotate-45" size={20} /></button>
                            </div>

                            {/* Telemetry Grid */}
                            <div className="p-6 grid grid-cols-2 gap-4">
                                <TelemetryCard
                                    label="Network IP"
                                    value={selectedUser.last_ip}
                                    icon={<Activity size={16} />}
                                    isSensitive={selectedUser.email === ADMIN_EMAIL}
                                />
                                <TelemetryCard
                                    label="Geo Location"
                                    value={selectedUser.country}
                                    icon={<Users size={16} />}
                                    isSensitive={selectedUser.email === ADMIN_EMAIL}
                                    fallback="📍 [SECURE LOCATION]"
                                />
                                <TelemetryCard
                                    label="Device Info"
                                    value={selectedUser.device_info}
                                    icon={<Shield size={16} />}
                                    isSensitive={selectedUser.email === ADMIN_EMAIL}
                                    fallback="📱 [ENCRYPTED DEVICE]"
                                    fullWidth
                                />
                                <TelemetryCard
                                    label="Traffic Source"
                                    value={selectedUser.traffic_source}
                                    icon={<Search size={16} />}
                                />
                                <TelemetryCard
                                    label="Last Active"
                                    value={selectedUser.last_active_at ? new Date(selectedUser.last_active_at).toLocaleString() : 'Never'}
                                    icon={<Activity size={16} />}
                                    fullWidth
                                />
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 border-t border-white/5 bg-slate-950/30 flex justify-end gap-3">
                                <button onClick={() => setSelectedUser(null)} className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-400 hover:bg-white/5 transition-colors">Close</button>
                                <button onClick={() => { handleAddCredits(selectedUser.id, selectedUser.credits || 0); setSelectedUser(null); }} className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors border border-cyan-500/20">Inject Credits</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const TelemetryCard = ({ label, value, icon, isSensitive, fallback, fullWidth }: any) => (
    <div className={`p-4 rounded-xl bg-slate-950/50 border border-white/5 ${fullWidth ? 'col-span-2' : 'col-span-1'}`}>
        <div className="flex items-center gap-2 mb-2 text-slate-500">
            {icon}
            <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
        </div>
        <div className={`font-mono text-sm ${isSensitive ? 'text-purple-400' : 'text-slate-200'}`}>
            {isSensitive ? (
                <div className="flex items-center gap-2">
                    <span className="blur-sm select-none opacity-50 pointer-events-none">192.168.0.1</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">{fallback || '🔒 REDACTED'}</span>
                </div>
            ) : (
                value || 'N/A'
            )}
        </div>
    </div>
);
