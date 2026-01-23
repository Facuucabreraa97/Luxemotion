import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CheckCircle, Zap, Activity, Terminal } from 'lucide-react';

export default function SentinelConsole() {
    const [logs, setLogs] = useState<any[]>([]);
    const [listening, setListening] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Initial Fetch
        const fetchLogs = async () => {
            const { data, error } = await supabase
                .from('sentinel_logs')
                .select('*')
                .order('timestamp', { ascending: false });

            if (data) setLogs(data);
            setLoading(false);
        };
        fetchLogs();

        // 2. REALTIME SUBSCRIPTION
        const channel = supabase
            .channel('sentinel-feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sentinel_logs' }, (payload) => {
                setLogs((prev) => [payload.new, ...prev]);
            })
            .subscribe((status) => setListening(status === 'SUBSCRIBED'));

        return () => { supabase.removeChannel(channel); };
    }, []);

    return (
        <div className="p-6 space-y-8 min-h-screen bg-black text-white font-sans">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Zap className="text-yellow-400" /> SENTINEL COMMAND
                </h1>
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500">
                    <Activity size={12} className={listening ? "text-green-500 animate-pulse" : "text-red-500"} />
                    {listening ? "Live Uplink Active" : "Connecting..."}
                </div>
            </div>

            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="p-8 text-center text-zinc-500 animate-pulse">Initializing Sentinel Protocol...</div>
                ) : logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-20 text-center">
                        <CheckCircle size={64} className="text-green-500/50 mb-6" />
                        <h2 className="text-2xl font-bold text-white mb-2">NO SENTINEL ACTIVITY DETECTED</h2>
                        <p className="text-zinc-500 tracking-widest uppercase text-sm">SYSTEM SECURE</p>
                    </div>
                ) : (
                    <div className="grid gap-2 p-4">
                        {logs.map((log) => (
                            <div key={log.id} className={`p-4 rounded-lg font-mono text-sm border-l-4 flex justify-between items-center ${log.status === 'FAILURE' || log.status === 'CRITICAL'
                                    ? 'bg-red-500/10 border-red-500 text-red-200'
                                    : 'bg-green-500/10 border-green-500 text-green-200'
                                }`}>
                                <div className="flex items-center gap-4">
                                    <span className="opacity-50 text-xs">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    <span className="font-bold uppercase tracking-wider">{log.action || 'EVENT'}</span>
                                    <span className="text-white/80">{log.message}</span>
                                </div>
                                {log.status === 'FAILURE' && <AlertTriangle size={16} />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
