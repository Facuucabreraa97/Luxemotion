import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CheckCircle, Zap, Activity } from 'lucide-react';

export default function SentinelConsole() {
    const [reports, setReports] = useState<any[]>([]);
    const [listening, setListening] = useState(false);

    useEffect(() => {
        // 1. Initial Fetch
        const fetchReports = async () => {
            const { data } = await supabase.from('admin_reports').select('*').order('created_at', { ascending: false });
            if (data) setReports(data);
        };
        fetchReports();

        // 2. REALTIME SUBSCRIPTION (The "God View" connection)
        const channel = supabase
            .channel('sentinel-feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_reports' }, (payload) => {
                setReports((prev) => [payload.new, ...prev]);
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

            <div className="grid gap-6">
                {reports.map((report) => (
                    <div key={report.id} className={`p-6 rounded-2xl backdrop-blur-md border transition-all ${report.status === 'CRITICAL' ? 'bg-red-900/10 border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.1)]' : 'bg-zinc-900/50 border-white/10'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    {report.status === 'CRITICAL' ? (
                                        <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><AlertTriangle size={12} /> CRITICAL INTERVENTION</span>
                                    ) : (
                                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> SYSTEM NOMINAL</span>
                                    )}
                                    <span className="text-zinc-500 text-xs">{new Date(report.created_at).toLocaleTimeString()}</span>
                                </div>
                                <h3 className="text-xl font-bold">Health Score: {report.health_score}/100</h3>
                            </div>

                            {}
                            {report.suggested_fix_pr_url && (
                                <a href={report.suggested_fix_pr_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-yellow-400/20">
                                    <Zap size={18} /> MERGE FIX
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
