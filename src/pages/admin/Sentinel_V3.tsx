import React, { useState } from 'react';
import { Users, DollarSign, Zap, LayoutDashboard } from 'lucide-react';
// USE RELATIVE IMPORTS to avoid alias issues (Corrected to actual location)
import UsersDatabase from './components/UsersDatabase';
import TreasuryLogs from './components/TreasuryLogs';
import SentinelConsole from './SentinelConsole';

export default function Sentinel_V3() {
    const [activeTab, setActiveTab] = useState('sentinel');

    const TABS = [
        { id: 'users', label: 'USERS DB', icon: Users, component: <UsersDatabase /> },
        { id: 'treasury', label: 'TREASURY', icon: DollarSign, component: <TreasuryLogs /> },
        { id: 'sentinel', label: 'SENTINEL AI (V3)', icon: Zap, component: <SentinelConsole />, highlight: true }
    ];

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans border-t-4 border-yellow-400">
            <header className="mb-10 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-yellow-400 flex items-center gap-3">
                    <LayoutDashboard /> VYDY OPS <span className="text-white text-sm bg-zinc-800 px-2 rounded">ISOTOPE V3</span>
                </h1>
            </header>
            <nav className="flex gap-6 border-b border-zinc-800 mb-8">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-4 flex items-center gap-2 text-sm font-bold tracking-widest ${activeTab === tab.id ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-zinc-500'}`}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </nav>
            <main>{TABS.find(t => t.id === activeTab)?.component}</main>
        </div>
    );
}
