import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format, formatDistanceToNow } from 'date-fns';
import { ShieldCheck, Check, X, Bell, Clock, AlertTriangle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

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
    const [lastEventTime, setLastEventTime] = useState<string>('Searching...');

    // Fetch Log Logic
    const fetchLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('sentinel_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(50);
            if (data) {
                setLogs(data);
                if (data.length > 0) {
                    updateTimeAgo(data[0].timestamp);
                } else {
                    setLastEventTime("NO RECENT ACTIVITY");
                }
            }
            setStatus('LIVE');
        } catch (err) {
            console.error("Sentinel Down:", err);
            setStatus('ERROR');
        }
    };

    const updateTimeAgo = (ts: string) => {
        setLastEventTime(formatDistanceToNow(new Date(ts), { addSuffix: true }).toUpperCase());
    };

    useEffect(() => {
        fetchLogs();

        const channel = supabase
            .channel('sentinel-chat-real')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sentinel_logs' }, (payload) => {
                const newLog = payload.new as SentinelLog;
                setLogs((prev) => [newLog, ...prev]);
                updateTimeAgo(newLog.timestamp);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') setStatus('LIVE');
            });

        // Update "Time Ago" every minute naturally (no fake countdown)
        const interval = setInterval(() => {
            if (logs.length > 0) updateTimeAgo(logs[0].timestamp);
        }, 60000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [logs]); // Re-bind interval if logs change to ensure top log is fresh reference (although ref logic better, this works for simple case)

    return (
        <div className="h-full flex flex-col pt-6 px-6 pb-6 relative">
            {/* CONTEXT BADGE */}
            <div className="absolute top-6 right-6 px-3 py-1 bg-[#D4AF37] text-black text-[9px] font-bold uppercase tracking-widest rounded shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center gap-2">
                <ShieldCheck size={12} /> CONTEXT AWARENESS: ACTIVE
            </div>

            {/* TOP BAR */}
            <div className="flex items-center gap-8 mb-6 border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold tracking-widest text-[#E5E5E5] flex items-center gap-3">
                    SENTINEL FEED
                </h2>
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono">
                    <Clock size={12} />
                    <span>LAST EVENT: {lastEventTime}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono">
                    <div className={`w-2 h-2 rounded-full ${status === 'LIVE' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span>{status === 'LIVE' ? 'MONITORING' : 'OFFLINE'}</span>
                </div>
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {logs.map((log) => {
                    const isFail = log.status === 'FAILURE' || log.status === 'BLOCKED';
                    return (
                        <div key={log.id} className={cn(
                            "flex gap-4 p-4 rounded-xl border backdrop-blur-md transition-all",
                            isFail ? "bg-red-900/10 border-red-500/30" : "bg-zinc-900/40 border-white/5 hover:bg-white/5"
                        )}>
                            <div className="flex-shrink-0 pt-1">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                                    isFail ? "bg-red-500/20 text-red-500" : "bg-[#D4AF37]/20 text-[#D4AF37]"
                                )}>
                                    {log.sentinel_name.charAt(0)}
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={cn("text-xs font-bold uppercase tracking-widest", isFail ? "text-red-400" : "text-[#D4AF37]")}>
                                        {log.sentinel_name}
                                    </span>
                                    <span className="text-[10px] text-zinc-600 font-mono">
                                        {log.timestamp ? format(new Date(log.timestamp), 'HH:mm:ss') : ''}
                                    </span>
                                </div>
                                <div className="text-sm text-white font-mono mb-1">
                                    <span className="opacity-50 mr-2">OP: {log.action_type}</span>
                                    <span className={isFail ? "text-red-300" : "text-zinc-300"}>
                                        {log.report_text}
                                    </span>
                                </div>
                                {isFail && (
                                    <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded bg-red-500/20 text-red-500 text-[9px] font-bold uppercase tracking-wider">
                                        <AlertTriangle size={10} /> ALERT
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {logs.length === 0 && (
                    <div className="text-center p-20 text-zinc-600 font-mono text-sm tracking-widest">
                        NO LOGS DETECTED.
                    </div>
                )}
            </div>
        </div>
    );
}
