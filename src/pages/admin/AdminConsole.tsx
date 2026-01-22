import React, { useState } from 'react';
import { Users, DollarSign, Zap } from 'lucide-react';
// VERIFY PATHS: Ensure these exist. If SentinelConsole is in parent, adjust import.
import UsersDatabase from './components/UsersDatabase';
import TreasuryLogs from './components/TreasuryLogs';
import SentinelConsole from './SentinelConsole';

export default function AdminConsole() {
    const [activeTab, setActiveTab] = useState('sentinel'); // DEFAULT TO SENTINEL

    const TABS = [
        { id: 'users', label: 'USERS DATABASE', icon: Users, component: <UsersDatabase /> },
        { id: 'treasury', label: 'TREASURY LOGS', icon: DollarSign, component: <TreasuryLogs /> },
        {
            id: 'sentinel',
            label: 'SENTINEL AI',
            icon: Zap,
            component: <SentinelConsole />,
            highlight: true
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <header className="mb-10 flex justify-between items-center border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                        VYDY OPS
                        <span className="bg-yellow-400 text-black text-xs px-2 py-1 rounded font-bold">v2.1 [LIVE]</span>
                    </h1>
                    <p className="text-zinc-400">Command Center & Intelligence Unit</p>
                </div>
            </header>

            {}
            <nav className="flex gap-8 border-b border-white/10 mb-8">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-4 flex items-center gap-2 text-sm font-bold tracking-widest transition-all ${activeTab === tab.id
                                ? (tab.highlight ? 'text-yellow-400 border-b-2 border-yellow-400 shadow-[0_4px_20px_-10px_rgba(250,204,21,0.5)]' : 'text-white border-b-2 border-white')
                                : 'text-zinc-500 hover:text-white'
                            }`}
                    >
                        <tab.icon size={16} className={activeTab === tab.id && tab.highlight ? "animate-pulse" : ""} />
                        {tab.label}
                    </button>
                ))}
            </nav>

            {}
            <main className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[500px]">
                {TABS.find(t => t.id === activeTab)?.component}
            </main>
        </div>
    );
}
