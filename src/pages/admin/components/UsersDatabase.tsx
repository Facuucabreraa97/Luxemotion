import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Search, Mail, Trash2, Zap, Ban, Loader2, AlertCircle } from 'lucide-react';

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
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
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

    // 1. APPROVE
    const handleApprove = async (id: string, email: string) => {
        setActionId(id);
        try {
            const session = (await supabase.auth.getSession()).data.session;
            const res = await fetch('/api/admin/approve-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                body: JSON.stringify({ email })
            });
            if (!res.ok) throw new Error('Failed');
            await fetchUsers();
        } catch (err) { setError("Approval Failed"); }
        finally { setActionId(null); }
    };

    // 2. DELETE (THE NEW FUNCTION)
    const handleDelete = async (id: string, email: string) => {
        if (!confirm(`⚠ WARNING: Permanently delete ${email}? This erases ALL videos, models, and data.`)) return;

        setActionId(id);
        try {
            const session = (await supabase.auth.getSession()).data.session;
            const res = await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                body: JSON.stringify({ userId: id })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');

            // Success: Remove from UI immediately
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch (err) {
            console.error(err);
            setError(`Delete Failed: ${(err as Error).message}`);
        }
        finally { setActionId(null); }
    };

    // 3. INJECT
    const handleInject = async () => {
        if (!injectModal) return;
        setActionId(injectModal.id);
        try {
            await supabase.rpc('add_credits', { user_id: injectModal.id, amount: injectAmount });
            await fetchUsers();
            setInjectModal(null);
        } catch (err) { setError("Inject Failed"); }
        finally { setActionId(null); }
    };

    return (
        <div className="min-h-full font-sans pb-20">
            <header className="px-6 py-4 border-b border-[#222] bg-[#050505] flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold tracking-[0.2em] text-[#E5E5E5]">CLIENT LEDGER</h2>
                    <span className="bg-[#111] text-[#777] px-2 py-0.5 rounded text-[10px] font-mono">{users.length}</span>
                </div>
            </header>

            {error && <div className="bg-red-900/20 p-2 text-center text-red-500 text-xs font-bold border-b border-red-900/50 flex justify-center gap-2"><AlertCircle size={12} />{error}</div>}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0A0A0A] text-[#444] text-[10px] uppercase font-bold tracking-widest sticky top-[57px] z-10">
                        <tr>
                            <th className="p-4 border-b border-[#111]">User</th>
                            <th className="p-4 border-b border-[#111]">Status</th>
                            <th className="p-4 border-b border-[#111]">Credits</th>
                            <th className="p-4 border-b border-[#111] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-[#888]">
                        {loading ? <tr><td colSpan={4} className="p-4 text-center animate-pulse">Loading...</td></tr> :
                            users.map((user) => (
                                <tr key={user.id} className="border-b border-[#111] hover:bg-[#080808]">
                                    <td className="p-4 text-[#E5E5E5] font-medium">
                                        <div className="flex flex-col"><span>{user.email}</span><span className="text-[10px] text-[#444] font-mono">{user.id.slice(0, 8)}</span></div>
                                    </td>
                                    <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${user.status === 'APPROVED' ? 'text-green-500 border-green-900/50' : 'text-yellow-500 border-yellow-900/50'}`}>{user.status}</span></td>
                                    <td className="p-4 text-[#D4AF37] font-mono">{user.credits} CR</td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button onClick={() => setInjectModal({ id: user.id, email: user.email })} className="p-2 hover:text-[#D4AF37]"><Zap size={16} /></button>

                                        {/* TRASH BUTTON */}
                                        <button onClick={() => handleDelete(user.id, user.email)} disabled={actionId === user.id} className="p-2 hover:bg-red-900/20 rounded-full text-[#555] hover:text-red-500">
                                            {actionId === user.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                        </button>

                                        {user.status === 'PENDING' && (
                                            <button onClick={() => handleApprove(user.id, user.email)} disabled={actionId === user.id} className="p-2 hover:text-green-500">
                                                {actionId === user.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {injectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl w-80">
                        <h3 className="text-[#D4AF37] font-bold mb-4">INJECT CREDITS</h3>
                        <input type="number" value={injectAmount} onChange={(e) => setInjectAmount(Number(e.target.value))} className="w-full bg-black border border-white/20 rounded p-2 text-white mb-4 text-center" />
                        <div className="flex gap-2">
                            <button onClick={() => setInjectModal(null)} className="flex-1 py-2 text-zinc-500">CANCEL</button>
                            <button onClick={handleInject} className="flex-1 py-2 bg-[#D4AF37] text-black rounded font-bold">CONFIRM</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
