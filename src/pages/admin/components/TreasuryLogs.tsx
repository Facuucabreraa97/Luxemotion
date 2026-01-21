import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DollarSign, RefreshCw } from 'lucide-react';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function TreasuryLogs() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        const { data } = await supabase.from('transactions').select('*, profiles(first_name, last_name, email)').order('created_at', { ascending: false });
        if (data) setTransactions(data);
        setLoading(false);
    };

    useEffect(() => { fetchLogs(); }, []);

    if (loading) return <div className="p-8 text-zinc-500 animate-pulse">Syncing Ledger...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-2">
                    <DollarSign className="text-emerald-400" /> Global Ledger
                </h2>
                <button onClick={fetchLogs} className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20 text-xs font-bold uppercase tracking-wider flex gap-2 items-center"><RefreshCw size={12} /> Sync Blockchain</button>
            </div>

            <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.02]">
                <table className="w-full text-left text-sm font-mono">
                    <thead className="bg-black/40 text-[10px] uppercase text-zinc-500 font-bold sticky top-0">
                        <tr><th className="p-4">Time</th><th className="p-4">TX ID</th><th className="p-4">User</th><th className="p-4">Concept</th><th className="p-4 text-right">Amount</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {transactions.map(tx => (
                            <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 text-zinc-500">{new Date(tx.created_at).toLocaleString()}</td>
                                <td className="p-4 text-[10px] text-zinc-600">{tx.id.slice(0, 8)}...</td>
                                <td className="p-4 text-zinc-300">
                                    {tx.profiles ? <span>{tx.profiles.email}</span> : 'UNKNOWN'}
                                </td>
                                <td className="p-4 text-xs text-zinc-400 uppercase">{tx.description}</td>
                                <td className={`p-4 text-right font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
