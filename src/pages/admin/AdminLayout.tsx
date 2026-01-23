import React, { useState } from 'react';
import { LayoutDashboard, ShieldAlert, Users, CreditCard, LogOut, Sparkles } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// COMPONENT IMPORTS
import AdminOverview from './components/AdminOverview';
import SentinelConsole from './components/SentinelConsole';
import UsersDatabase from './components/UsersDatabase';


// UTILS
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Placeholder for Treasury
const TreasuryView = () => <div className="p-10 text-zinc-500 font-mono">TREASURY MODULE LOCKED</div>;

export default function AdminLayout() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'sentinel' | 'users' | 'billing'>('dashboard');

    const MENU = [
        { id: 'dashboard', label: 'OVERVIEW', icon: LayoutDashboard },
        { id: 'sentinel', label: 'SENTINEL AI', icon: ShieldAlert },
        { id: 'users', label: 'PRIVATE BANKING', icon: Users },
        { id: 'billing', label: 'TREASURY', icon: CreditCard },
    ] as const;

    return (
        <div className="flex h-screen bg-[#000000] text-[#E5E5E5] font-sans selection:bg-[#D4AF37] selection:text-black">
            {/* SIDEBAR */}
            <aside className="w-64 bg-[#050505] border-r border-[#222222] flex flex-col justify-between">
                <div>
                    {/* Header */}
                    <div className="h-16 flex items-center px-6 border-b border-[#111111]">
                        <h1 className="text-lg font-bold tracking-tighter text-white">
                            VYDY<span className="text-[#D4AF37]">.OPS</span>
                        </h1>
                    </div>

                    {/* Navigation */}
                    <nav className="p-4 space-y-2">
                        {MENU.map((item) => {
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 text-xs font-bold tracking-widest transition-all duration-300 rounded-r-lg border-l-2",
                                        isActive
                                            ? "text-[#D4AF37] bg-[#D4AF37]/5 border-[#D4AF37]"
                                            : "text-[#737373] hover:text-white border-transparent hover:bg-white/5"
                                    )}
                                >
                                    <item.icon size={16} className={isActive ? "text-[#D4AF37]" : "text-[#555] group-hover:text-white"} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#111]">
                    <button className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-[#737373] hover:text-red-500 w-full transition-colors">
                        <LogOut size={16} /> LOGOUT
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-auto bg-black relative">
                {/* Background Ambience */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="relative z-10 h-full">
                    {activeTab === 'dashboard' && <AdminOverview />}
                    {activeTab === 'sentinel' && <SentinelConsole />}
                    {activeTab === 'users' && <UsersDatabase />}
                    {activeTab === 'billing' && <TreasuryView />}

                </div>
            </main>
        </div>
    );
}
