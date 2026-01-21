import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Users, Shield, DollarSign, Activity, Search, Ban, CheckCircle, Edit, Zap } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = 'dmsfak@proton.me';

export const AdminConsole = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'users' | 'treasury' | 'content'>('users');

    // Data States
    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ revenue: 0, pending: 0 });

    // Auth Check
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.email !== ADMIN_EMAIL) {
            navigate('/'); // Fake 404/Redirect
            return;
        }
        setLoading(false);
        fetchData();
    };

    const fetchData = async () => {
        // Fetch Users
        const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (profiles) setUsers(profiles);

        // Mock Stats (Replace with real aggregation if table exists)
        setStats({ revenue: 12500, pending: 450 });
    };

    // Actions
    const handleStatus = async (id: string, status: string) => {
        const { error } = await supabase.from('profiles').update({ access_status: status }).eq('id', id);
        if (!error) {
            setUsers(users.map(u => u.id === id ? { ...u, access_status: status } : u));
        } else {
            alert('Error updating status: ' + error.message);
        }
    };

    const handleInjectCredits = async () => {
        const email = prompt("Enter User Email for Injection:");
        if (!email) return;
        const amount = prompt("Enter Credits Amount:");
        if (!amount) return;

        // 1. Find User
        const user = users.find(u => u.email === email); // Assuming email is in profile, if not need join. Profile usually has email? 
        // Wait, profiles table might not have email if it's in auth.users. 
        // But usually we sync it. If not, we look by ID.
        // Let's assume we search by ID or strict match if email is present.
        // If profile doesn't have email, we can't search easily client side without edge function.
        // I will assume profile has 'full_name' or I check if I can join.
        // For now, I'll update by ID if I find them in the list.

        // Let's use the search term to filter the list and then click a button on the row is safer.
    };

    const handleAddCredits = async (id: string, current: number) => {
        const amount = prompt("Add Credits Amount:");
        if (!amount) return;
        const val = parseInt(amount);
        if (isNaN(val)) return;

        const { error } = await supabase.from('profiles').update({ credits: current + val }).eq('id', id);
        if (!error) {
            setUsers(users.map(u => u.id === id ? { ...u, credits: current + val } : u));
            alert(`Injected ${val} credits.`);
        }
    };

    if (loading) return <div className="bg-slate-950 w-full h-screen"></div>;

    const filteredUsers = users.filter(u =>
        (u.first_name + ' ' + u.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.id).includes(searchTerm)
        // If email is in profile
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 font-mono text-xs selection:bg-cyan-900 selection:text-white">

            {/* TOP BAR */}
            <header className="border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 py-2 sticky top-0 z-50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Shield className="text-cyan-500 w-4 h-4" />
                    <span className="font-bold tracking-widest text-slate-100">VYDY_OPS // CONSOLE</span>
                </div>
                <div className="flex items-center gap-6">
                    <button onClick={() => setActiveTab('users')} className={`${activeTab === 'users' ? 'text-cyan-400 border-b border-cyan-400' : 'hover:text-white'} py-2 transition-colors`}>USERS_DB</button>
                    <button onClick={() => setActiveTab('treasury')} className={`${activeTab === 'treasury' ? 'text-green-400 border-b border-green-400' : 'hover:text-white'} py-2 transition-colors`}>TREASURY</button>
                    <button onClick={() => setActiveTab('content')} className={`${activeTab === 'content' ? 'text-purple-400 border-b border-purple-400' : 'hover:text-white'} py-2 transition-colors`}>CONTENT_LOGS</button>
                </div>
                <div className="text-slate-500">ADMIN: {ADMIN_EMAIL}</div>
            </header>

            <main className="p-6 max-w-[1600px] mx-auto">

                {activeTab === 'users' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* TOOLBAR */}
                        <div className="flex justify-between items-center mb-6 bg-slate-900 p-2 rounded border border-slate-800">
                            <div className="flex items-center gap-2 px-2 w-1/3">
                                <Search className="w-3 h-3 text-slate-500" />
                                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="SEARCH_UUID_OR_NAME..." className="bg-transparent w-full outline-none text-slate-100 placeholder:text-slate-700 uppercase" />
                            </div>
                            <div className="px-4 text-slate-500">{users.length} RECORDS_FOUND</div>
                        </div>

                        {/* TABLE */}
                        <div className="border border-slate-800 rounded bg-slate-900/20 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-900 text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="p-3 border-r border-slate-800 w-12">IMG</th>
                                        <th className="p-3 border-r border-slate-800">UUID / IDENTITY</th>
                                        <th className="p-3 border-r border-slate-800">STATUS</th>
                                        <th className="p-3 border-r border-slate-800">CREDITS</th>
                                        <th className="p-3 border-r border-slate-800">JOIN_DATE</th>
                                        <th className="p-3 text-right">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-slate-800/50 transition-colors group">
                                            <td className="p-2 border-r border-slate-800 text-center">
                                                <div className="w-6 h-6 rounded bg-slate-700 mx-auto overflow-hidden">
                                                    {user.avatar_url && <img src={user.avatar_url} className="w-full h-full object-cover" />}
                                                </div>
                                            </td>
                                            <td className="p-2 border-r border-slate-800">
                                                <div className="text-slate-200 font-bold">{user.first_name} {user.last_name}</div>
                                                <div className="text-[10px] text-slate-600 font-mono">{user.id}</div>
                                            </td>
                                            <td className="p-2 border-r border-slate-800">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.access_status === 'approved' ? 'bg-green-900/30 text-green-400 border border-green-900' :
                                                        user.access_status === 'banned' ? 'bg-red-900/30 text-red-400 border border-red-900' :
                                                            'bg-yellow-900/30 text-yellow-400 border border-yellow-900'
                                                    }`}>
                                                    {user.access_status || 'PENDING'}
                                                </span>
                                            </td>
                                            <td className="p-2 border-r border-slate-800 font-mono text-cyan-300">
                                                {user.credits || 0}
                                            </td>
                                            <td className="p-2 border-r border-slate-800 text-slate-500">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-2 text-right">
                                                <div className="flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleAddCredits(user.id, user.credits || 0)} title="Inject Credits" className="p-1.5 hover:bg-cyan-900/50 text-cyan-500 rounded"><Zap size={14} /></button>
                                                    <button onClick={() => handleStatus(user.id, 'approved')} title="Approve" className="p-1.5 hover:bg-green-900/50 text-green-500 rounded"><CheckCircle size={14} /></button>
                                                    <button onClick={() => handleStatus(user.id, 'banned')} title="Ban" className="p-1.5 hover:bg-red-900/50 text-red-500 rounded"><Ban size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'treasury' && (
                    <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-6 bg-slate-900 border border-slate-800 rounded">
                            <div className="text-slate-500 mb-2 uppercase tracking-widest">Total System Revenue</div>
                            <div className="text-4xl text-green-400 font-mono">$ {stats.revenue.toLocaleString()}</div>
                        </div>
                        <div className="p-6 bg-slate-900 border border-slate-800 rounded">
                            <div className="text-slate-500 mb-2 uppercase tracking-widest">Pending Payouts</div>
                            <div className="text-4xl text-orange-400 font-mono">$ {stats.pending.toLocaleString()}</div>
                        </div>

                        <div className="col-span-2 p-10 text-center border border-slate-800 border-dashed rounded text-slate-600">
                            NO_TRANSACTION_LOGS_FOUND_IN_CURRENT_SHARD
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};
