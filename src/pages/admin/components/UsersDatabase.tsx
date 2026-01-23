import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Search, Mail, Trash2, RefreshCw, AlertCircle, Zap, Ban, Loader2 } from 'lucide-react';

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
    const [actionId, setActionId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [injectModal, setInjectModal] = useState<{ id: string, email: string } | null>(null);
    const [injectAmount, setInjectAmount] = useState(100);

    const fetchUsers = async () => {
        // Background refresh without full loader to avoid flicker
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (data) setUsers(data as Profile[]);
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchUsers();
            setLoading(false);
        };
        init();
    }, []);

    // HANDLER: APPROVE (Server Call)
    const handleApprove = async (id: string, email: string) => {
        setActionId(id);
        try {
            const session = (await supabase.auth.getSession()).data.session;
            const res = await fetch('/api/admin/approve-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                body: JSON.stringify({ email })
            });
            if (!res.ok) throw new Error('Server Approval Failed');
            await fetchUsers(); // Sync
        } catch (err) {
            console.error(err);
            setError(`Failed to approve ${email}`);
        } finally { setActionId(null); }
    };

    // HANDLER: DELETE (Server Call)
    const handleDelete = async (id: string, email: string) => {
        if (!confirm(`CONFIRM: Permanently delete ${email}? This erases all their videos and cannot be undone.`)) return;

        setActionId(id);
        try {
            const session = (await supabase.auth.getSession()).data.session;
            const res = await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                body: JSON.stringify({ userId: id })
            });

            if (!res.ok) throw new Error('Delete Failed');

            // Remove locally
            setUsers(prev => prev.filter(u => u.id !== id));
            await fetchUsers(); // Sync to be sure
        } catch (err) {
            console.error(err);
            setError("Delete Failed");
        } finally { setActionId(null); }
    };

    // HANDLER: INJECT (RPC)
    const handleInject = async () => {
        if (!injectModal) return;
        const { id } = injectModal;
        setActionId(id);
        try {
            await supabase.rpc('add_credits', { user_id: id, amount: injectAmount });
            await fetchUsers();
            setInjectModal(null);
        } catch (err) {
            setError("Injection Failed");
        } finally { setActionId(null); }
    };

    return (
        <div className="min-h-full font-sans relative pb-20">
            <header className="px-6 py-4 border-b border-[#222] bg-[#050505] flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold tracking-[0.2em] text-[#E5E5E5]">CLIENT LEDGER</h2>
                    <span className="bg-[#111] text-[#777] px-2 py-0.5 rounded text-[10px] font-mono">{users.length} RECORDS</span>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" size={14} />
                    <input type="text" placeholder="SEARCH..." className="bg-[#0A0A0A] border border-[#222] rounded-full pl-9 pr-4 py-1.5 text-xs text-[#E5E5E5] w-64 outline-none" />
                </div>
            </header>

            {error && <div className="bg-red-900/20 p-2 text-center text-red-500 text-xs font-bold border-b border-red-900/50 flex justify-center items-center gap-2"><AlertCircle size={12} /> {error}</div>}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0A0A0A] text-[#444] text-[10px] uppercase font-bold tracking-widest sticky top-[57px] z-10">
                        <tr>
                            <th className="p-4 border-b border-[#111]">Client</th>
                            <th className="p-4 border-b border-[#111]">Status</th>
                            <th className="p-4 border-b border-[#111]">Balance</th>
                            <th className="p-4 border-b border-[#111] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-[#888]">
                        {loading ? <tr><td colSpan={4} className="p-4 text-center animate-pulse">Loading...</td></tr> :
                            users.map((user) => (
                                <tr key={user.id} className="border-b border-[#111] hover:bg-[#080808] transition-colors">
                                    <td className="p-4 text-[#E5E5E5] font-medium flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#111] border border-[#222] flex items-center justify-center text-[#444]"><Mail size={12} /></div>
                                        <div className="flex flex-col"><span>{user.email}</span><span className="text-[10px] text-[#444] font-mono">{user.id.slice(0, 8)}</span></div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold border ${user.status === 'APPROVED' ? 'text-green-500 border-green-900/50 bg-green-900/10' : 'text-yellow-500 border-yellow-900/50 bg-yellow-900/10'}`}>{user.status}</span>
                                    </td>
                                    <td className="p-4 font-mono text-[#D4AF37]">{user.credits} CR</td>
                                    <td className="p-4 text-right flex items-center justify-end gap-2">
                                        <button onClick={() => setInjectModal({ id: user.id, email: user.email })} className="p-2 hover:bg-[#D4AF37]/10 rounded-full text-[#555] hover:text-[#D4AF37] transition-colors"><Zap size={16} /></button>

                                        {/* DELETE BUTTON (ADDED) */}
                                        <button onClick={() => handleDelete(user.id, user.email)} disabled={actionId === user.id} className="p-2 hover:bg-red-900/20 rounded-full text-[#555] hover:text-red-500 transition-colors" title="Delete User">
                                            {actionId === user.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                        </button>

                                        {user.status === 'PENDING' && (
                                            <button onClick={() => handleApprove(user.id, user.email)} disabled={actionId === user.id} className="p-2 hover:bg-green-500/10 rounded-full text-[#555] hover:text-green-500 transition-colors">
                                                {actionId === user.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl w-80 shadow-2xl">
                        <h3 className="text-[#D4AF37] font-bold text-lg mb-4 uppercase tracking-widest">Inject Credits</h3>
                        <input type="number" value={injectAmount} onChange={(e) => setInjectAmount(Number(e.target.value))} className="w-full bg-black border border-white/20 rounded p-2 text-white text-center focus:border-[#D4AF37] outline-none mb-4" />
                        <div className="flex gap-2">
                            <button onClick={() => setInjectModal(null)} className="flex-1 py-2 text-xs font-bold uppercase text-zinc-500 hover:text-white">Cancel</button>
                            <button onClick={handleInject} className="flex-1 py-2 text-xs font-bold uppercase bg-[#D4AF37] text-black rounded hover:bg-[#C6A649]">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
