import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Search, Mail, StopCircle, RefreshCw, AlertCircle } from 'lucide-react';

interface Profile {
    id: string;
    email: string;
    status: 'PENDING' | 'APPROVED';
    credits: number;
    created_at?: string;
}

export default function UsersDatabase() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (data) setUsers(data as Profile[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleApprove = async (email: string) => {
        setActionId(email);
        setError(null);

        try {
            // OPTIMISTIC UPDATE
            setUsers(prev => prev.map(u => u.email === email ? { ...u, status: 'APPROVED' } : u));

            const response = await fetch('/api/admin/approve-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!response.ok) throw new Error('API Approval Failed');
        } catch (err) {
            console.error("Approval Failed", err);
            setError(`Failed to approve ${email}`);
            fetchUsers(); // Revert
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="min-h-full font-sans">
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
            <div className="p-0">
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
                                    {user.email}
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border ${user.status === 'APPROVED'
                                            ? 'text-green-500 border-green-900/50 bg-green-900/10'
                                            : 'text-yellow-500 border-yellow-900/50 bg-yellow-900/10'
                                        }`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="p-4 font-mono text-[#777]">
                                    {user.credits} <span className="text-[10px] text-[#444]">CR</span>
                                </td>
                                <td className="p-4 text-right">
                                    {user.status === 'PENDING' ? (
                                        <button
                                            onClick={() => handleApprove(user.email)}
                                            disabled={actionId === user.email}
                                            className="text-[#555] hover:text-[#D4AF37] transition-colors disabled:opacity-50"
                                            title="Approve Access"
                                        >
                                            {actionId === user.email ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                        </button>
                                    ) : (
                                        <StopCircle size={18} className="ml-auto text-[#222]" />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
