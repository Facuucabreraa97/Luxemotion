import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Users, Shield, Zap, Search, Ban, CheckCircle, Activity, RotateCw } from 'lucide-react';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
const ADMIN_EMAIL = 'dmsfak@proton.me';

export default function UsersDatabase() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchUsers = async () => {
        setRefreshing(true);
        const { data } = await supabase.from('profiles').select('*');
        if (data) {
            setUsers(data.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()));
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleStatus = async (id: string, status: string) => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, access_status: status } : u));
        await supabase.from('profiles').update({ access_status: status }).eq('id', id);
    };

    const handleAddCredits = async (id: string, current: number) => {
        const amountStr = prompt("INJECT AMOUNT (CR): (Positive=Deposit, Negative=Deduct)");
        if (!amountStr) return;
        const amount = parseInt(amountStr);
        if (isNaN(amount)) return;
        // Optimistic
        setUsers(prev => prev.map(u => u.id === id ? { ...u, credits: (u.credits || 0) + amount } : u));
        // RPC
        await supabase.rpc('add_credits', { target_user_id: id, credit_amount: amount, reason: "Admin Grant" });
    };

    const filteredUsers = users.filter(u => {
        const s = searchTerm.toLowerCase();
        return `${u.first_name} ${u.last_name}`.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s);
    });

    if (loading) return <div className="p-8 text-zinc-500 animate-pulse">Loading Database...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search Users..." className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-yellow-400/50 outline-none" />
                </div>
                <button onClick={fetchUsers} className={`p-2 rounded-full hover:bg-white/5 ${refreshing ? 'animate-spin' : ''}`}><RotateCw size={16} /></button>
            </div>

            <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.02]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-black/40 text-[10px] uppercase text-zinc-500 font-bold sticky top-0">
                        <tr><th className="p-4">User</th><th className="p-4">Status</th><th className="p-4">Credits</th><th className="p-4 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredUsers.map(user => (
                            <tr key={user.id} onClick={() => setSelectedUser(user)} className="group hover:bg-white/5 cursor-pointer transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-white">{user.first_name} {user.last_name}</div>
                                    <div className="text-xs text-zinc-500">{user.email}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.access_status === 'approved' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>{user.access_status || 'PENDING'}</span>
                                </td>
                                <td className="p-4 text-zinc-300 font-mono">{user.credits} CR</td>
                                <td className="p-4 text-right flex justify-end gap-2 opacity-60 group-hover:opacity-100">
                                    <button onClick={(e) => { e.stopPropagation(); handleAddCredits(user.id, user.credits); }} className="p-1 hover:text-yellow-400"><Zap size={14} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleStatus(user.id, 'approved'); }} className="p-1 hover:text-green-400"><CheckCircle size={14} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleStatus(user.id, 'banned'); }} className="p-1 hover:text-red-400"><Ban size={14} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
                    <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">Telemetry: {selectedUser.first_name}</h2>
                        <div className="space-y-2 text-sm text-zinc-400">
                            <div className="flex justify-between"><span>IP:</span> <span className="text-white font-mono">{selectedUser.last_ip || 'N/A'}</span></div>
                            <div className="flex justify-between"><span>Country:</span> <span className="text-white">{selectedUser.country || 'N/A'}</span></div>
                            <div className="flex justify-between"><span>Device:</span> <span className="text-white">{selectedUser.device_info || 'N/A'}</span></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
