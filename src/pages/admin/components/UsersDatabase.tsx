import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Search, Mail, StopCircle, RefreshCw, AlertCircle, Zap, Ban } from 'lucide-react';
import { format } from 'date-fns';

interface Profile {
    id: string;
    email: string;
    status: 'PENDING' | 'APPROVED' | 'BANNED';
    credits: number;
    created_at?: string;
}

export default function UsersDatabase() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null); // For loading state of specific row
    const [error, setError] = useState<string | null>(null);
    const [injectModal, setInjectModal] = useState<{ id: string, email: string } | null>(null);
    const [injectAmount, setInjectAmount] = useState(100);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (data) setUsers(data as Profile[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // RPC HELPER
    const callRpc = async (fn: string, params: object) => {
        const { data, error } = await supabase.rpc(fn, params);
        if (error) throw error;
        return data;
    };

    // APPROVE
    const handleApprove = async (id: string, email: string) => {
        setActionId(id);
        try {
            setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'APPROVED' } : u));

            const session = (await supabase.auth.getSession()).data.session;
            const res = await fetch('/api/admin/approve-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ email })
            });

            if (!res.ok) throw new Error('Server rejected approval');
            console.log("Native Approval Success");

        } catch (err) {
            console.error("Approval Failed:", err);
            setError("Failed to approve user");
            fetchUsers();
        } finally { setActionId(null); }
    };

    // BAN
    const handleBan = async (id: string) => {
        if (!confirm('Are you sure you want to BAN this user?')) return;
        setActionId(id);
        try {
            setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'BANNED' } : u));
            await callRpc('update_user_status', { user_id: id, new_status: 'BANNED' });
        } catch (err) {
            console.error(err);
            fetchUsers();
        } finally { setActionId(null); }
    };

    // INJECT CREDITS
    const handleInject = async () => {
        if (!injectModal) return;
        const { id } = injectModal;
        setActionId(id);
        try {
            await callRpc('add_credits', { user_id: id, amount: injectAmount });
            setUsers(prev => prev.map(u => u.id === id ? { ...u, credits: (u.credits || 0) + injectAmount } : u));
            setInjectModal(null);
        } catch (err) {
            console.error(err);
            setError("Failed to inject credits");
        } finally { setActionId(null); }
    };

    return (
        <div className="min-h-full font-sans relative">
            {/* Header */}
            <header className="px-6 py-4 border-b border-[#222] bg-[#050505] flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold tracking-[0.2em] text-[#E5E5E5]">CLIENT LEDGER</h2>
                    <span className="bg-[#111] text-[#777] px-2 py-0.5 rounded text-[10px] font-mono">{users.length} RECORDS</span>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" size={14} />
                    <input
                        type="text"
                        placeholder="SEARCH EMAIL..."
                        className="bg-[#0A0A0A] border border-[#222] rounded-full pl-9 pr-4 py-1.5 text-xs text-[#E5E5E5] placeholder-[#444] focus:outline-none focus:border-[#444] w-64 transition-all"
                    />
                </div>
            </header>

            {error && (
                <div className="bg-red-900/20 border-b border-red-900/50 p-2 text-center text-red-500 text-xs font-bold flex justify-center items-center gap-2">
                    <AlertCircle size={12} /> {error}
                </div>
            )}

            {/* Table */}
            <div className="p-0 pb-20">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0A0A0A] text-[#444] text-[10px] uppercase font-bold tracking-widest sticky top-[57px] z-10 shadow-sm">
                        <tr>
                            <th className="p-4 border-b border-[#111]">Client ID</th>
                            <th className="p-4 border-b border-[#111]">Status</th>
                            <th className="p-4 border-b border-[#111]">Portfolio (Credits)</th>
                            <th className="p-4 border-b border-[#111] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-[#888]">
                        {loading ? Array(5).fill(0).map((_, i) => (
                            <tr key={i} className="border-b border-[#111] animate-pulse">
                                <td className="p-4"><div className="h-4 bg-[#111] rounded w-32" /></td>
                                <td className="p-4"><div className="h-4 bg-[#111] rounded w-16" /></td>
                                <td className="p-4"><div className="h-4 bg-[#111] rounded w-12" /></td>
                                <td className="p-4"></td>
                            </tr>
                        )) : users.map((user) => (
                            <tr key={user.id} className="border-b border-[#111] hover:bg-[#080808] transition-colors group">
                                <td className="p-4 text-[#E5E5E5] font-medium flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#111] to-[#000] border border-[#222] flex items-center justify-center text-[#444] text-[10px]">
                                        <Mail size={12} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span>{user.email}</span>
                                        <span className="text-[10px] text-[#444] font-mono">{user.id.slice(0, 8)}...</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border ${user.status === 'APPROVED' ? 'text-green-500 border-green-900/50 bg-green-900/10' :
                                        user.status === 'BANNED' ? 'text-red-500 border-red-900/50 bg-red-900/10 line-through' :
                                            'text-yellow-500 border-yellow-900/50 bg-yellow-900/10'
                                        }`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="p-4 font-mono text-[#777]">
                                    {user.credits} <span className="text-[10px] text-[#444]">CR</span>
                                </td>
                                <td className="p-4 text-right flex items-center justify-end gap-2">
                                    <button onClick={() => setInjectModal({ id: user.id, email: user.email })} className="p-2 hover:bg-[#D4AF37]/10 rounded-full text-[#555] hover:text-[#D4AF37] transition-colors" title="Inject Credits">
                                        <Zap size={16} />
                                    </button>
                                    {user.status === 'PENDING' && (
                                        <button
                                            onClick={() => handleApprove(user.id, user.email)}
                                            disabled={actionId === user.id}
                                            className="p-2 hover:bg-green-500/10 rounded-full text-[#555] hover:text-green-500 transition-colors"
                                            title="Approve"
                                        >
                                            {actionId === user.id ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                        </button>
                                    )}
                                    {user.status !== 'BANNED' && (
                                        <button
                                            onClick={() => handleBan(user.id)}
                                            disabled={actionId === user.id}
                                            className="p-2 hover:bg-red-500/10 rounded-full text-[#555] hover:text-red-500 transition-colors"
                                            title="Ban User"
                                        >
                                            <Ban size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* INJECT MODAL */}
            {injectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl w-80 shadow-2xl">
                        <h3 className="text-[#D4AF37] font-bold text-lg mb-1 uppercase tracking-widest">Inject Credits</h3>
                        <p className="text-zinc-500 text-xs mb-4">Target: {injectModal.email}</p>
                        <input
                            type="number"
                            value={injectAmount}
                            onChange={(e) => setInjectAmount(Number(e.target.value))}
                            className="w-full bg-black border border-white/20 rounded p-2 text-white font-mono mb-4 text-center focus:border-[#D4AF37] outline-none"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setInjectModal(null)} className="flex-1 py-2 text-xs font-bold uppercase text-zinc-500 hover:text-white">Cancel</button>
                            <button onClick={handleInject} className="flex-1 py-2 text-xs font-bold uppercase bg-[#D4AF37] text-black rounded hover:bg-[#C6A649]">Inject</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
