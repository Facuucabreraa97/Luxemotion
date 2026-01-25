import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        // Security check should be strictly reinforced by RLS in prod, 
        // but for now we will rely on checking if they can even fetch the data.
        const { data, error } = await supabase
            .from('whitelist')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            alert('Access Denied');
            navigate('/app');
            return;
        }

        setRequests(data);
        setLoading(false);
    };

    const updateStatus = async (email: string, status: 'approved' | 'rejected') => {
        try {
            await supabase
                .from('whitelist')
                .update({ status })
                .eq('email', email);
            loadRequests(); // Refresh
        } catch (e) {
            alert('Error updating status');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <header className="mb-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <button onClick={() => navigate('/app')} className="text-gray-400 hover:text-white">Back to App</button>
            </header>

            <div className="max-w-4xl mx-auto">
                <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <h2 className="text-xl font-bold">Whitelist Requests</h2>
                        <span className="text-sm text-gray-500">{requests.length} Total</span>
                    </div>

                    <div className="divide-y divide-white/5">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : requests.map((req) => (
                            <div key={req.email} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div>
                                    <p className="font-medium text-white">{req.email}</p>
                                    <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500' :
                                            req.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                                                'bg-yellow-500/20 text-yellow-500'
                                        }`}>
                                        {req.status}
                                    </span>

                                    {req.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => updateStatus(req.email, 'approved')}
                                                className="p-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-bold"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => updateStatus(req.email, 'rejected')}
                                                className="p-2 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-500 rounded-lg text-xs font-bold"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
