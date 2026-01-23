import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Shield, AlertTriangle } from 'lucide-react';

interface SentinelLog {
    id: number;
    sentinel_name: string;
    action_type: string;
    status: string;
    report_text: string;
    timestamp: string;
}

export default function SentinelConsole() {
    const [logs, setLogs] = useState<SentinelLog[]>([]);
    const [status, setStatus] = useState<'CONNECTING' | 'LIVE' | 'ERROR'>('CONNECTING');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { data, error } = await supabase
                    .from('sentinel_logs')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(100);

                if (error) throw error;
                if (data) setLogs(data);
                setStatus('LIVE');
            } catch (err) {
                console.error("Sentinel Down:", err);
                setStatus('ERROR');
            }
        };

        fetchLogs();

        const channel = supabase
            .channel('sentinel-feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sentinel_logs' }, (payload) => {
                setLogs((prev) => [payload.new as SentinelLog, ...prev]);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    if (status === 'ERROR') return (
        <div className="p-10 flex flex-col items-center justify-center text-red-500 h-full font-mono">
            <AlertTriangle size={48} className="mb-4 animate-pulse" />
            <h2 className="text-xl tracking-widest">CONNECTION SEVERED</h2>
        </div>
    );

    return (
        <div className="min-h-full font-sans">
            {/* Header */}
            <header className="px-6 py-4 border-b border-[#222] bg-[#050505] flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <Shield className="text-[#D4AF37]" size={20} />
                    <h2 className="text-sm font-bold tracking-[0.2em] text-[#E5E5E5]">SENTINEL CONTROL</h2>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-green-500 tracking-widest">LIVE FEED</span>
                </div>
            </header>

            {/* Terminal Table */}
            <div className="p-0">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0A0A0A] text-[#444] text-[10px] uppercase font-bold tracking-widest sticky top-[57px] z-10 shadow-sm">
                        <tr>
                            <th className="p-4 border-b border-[#111]">Timestamp</th>
                            <th className="p-4 border-b border-[#111]">Sentinel</th>
                            <th className="p-4 border-b border-[#111]">Action</th>
                            <th className="p-4 border-b border-[#111]">Status</th>
                            <th className="p-4 border-b border-[#111] w-1/2">Report Payload</th>
                        </tr>
                    </thead>
                    <tbody className="font-mono text-xs text-[#888]">
                        {logs.map((log) => (
                            <tr key={log.id} className="border-b border-[#111] hover:bg-[#080808] transition-colors group">
                                <td className="p-4 text-[#555] group-hover:text-[#777]">
                                    {log.timestamp ? format(new Date(log.timestamp), 'MMM dd, HH:mm:ss') : '-'}
                                </td>
                                <td className="p-4 text-[#D4AF37] opacity-80">{log.sentinel_name}</td>
                                <td className="p-4 text-[#AAA]">{log.action_type}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${log.status === 'SUCCESS' ? 'text-green-500 bg-green-900/10' :
                                            log.status === 'BLOCKED' ? 'text-orange-500 bg-orange-900/10' :
                                                'text-red-500 bg-red-900/10'
                                        }`}>
                                        {log.status}
                                    </span>
                                </td>
                                <td className="p-4 text-[#666] truncate group-hover:whitespace-normal group-hover:text-[#AAA] transition-all max-w-md">
                                    {log.report_text}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {logs.length === 0 && status !== 'ERROR' && (
                    <div className="p-20 text-center text-[#333] font-mono tracking-widest text-sm">
                        Waiting for signal...
                    </div>
                )}
            </div>
        </div>
    );
}
