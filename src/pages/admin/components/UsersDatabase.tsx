import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Trash2, Loader2 } from 'lucide-react';

export default function UsersDatabase() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);

    useEffect(() => {
        supabase.from('profiles').select('*').order('created_at', { ascending: false })
            .then(({ data }) => { if (data) setUsers(data); setLoading(false); });
    }, []);

    const handleDelete = async (id: string, email: string) => {
        if (!confirm(`DELETE ${email}?`)) return;
        setActionId(id);
        try {
            const session = (await supabase.auth.getSession()).data.session;
            await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                body: JSON.stringify({ userId: id })
            });
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch (e) { alert("Error deleting"); } finally { setActionId(null); }
    };

    const handleApprove = async (id: string, email: string) => {
        setActionId(id);
        try {
            const session = (await supabase.auth.getSession()).data.session;
            await fetch('/api/admin/approve-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                body: JSON.stringify({ email })
            });
            setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'APPROVED' } : u));
        } catch (e) { alert("Error approving"); } finally { setActionId(null); }
    };

    return (
        <div className="p-4 bg-black min-h-full text-white font-sans">
            <h2 className="text-[#D4AF37] font-bold mb-4">USERS DATABASE</h2>
            {loading ? <div>Loading...</div> : users.map(user => (
                <div key={user.id} className="flex justify-between items-center border-b border-white/10 p-3 hover:bg-white/5">
                    <div><div className="font-bold text-sm">{user.email}</div><div className="text-[10px] text-zinc-500">{user.status}</div></div>
                    <div className="flex gap-2">
                        {user.status === 'PENDING' && (
                            <button onClick={() => handleApprove(user.id, user.email)} disabled={actionId === user.id} className="p-2 text-green-500 hover:bg-green-900/20 rounded">
                                {actionId === user.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                            </button>
                        )}
                        <button onClick={() => handleDelete(user.id, user.email)} disabled={actionId === user.id} className="p-2 text-red-500 hover:bg-red-900/20 rounded">
                            {actionId === user.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
