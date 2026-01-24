import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import AdminConsole from './AdminConsole';
import UsersDatabase from './components/UsersDatabase';
import TreasuryLogs from './components/TreasuryLogs';
import { LayoutDashboard, Users, Wallet, ShieldAlert, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminLayout() {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-black text-white flex font-sans">
            {/* SIDEBAR */}
            <aside className="w-64 border-r border-white/10 p-6 flex flex-col">
                <div className="mb-10 flex items-center gap-2 text-[#D4AF37]">
                    <ShieldAlert size={24} />
                    <span className="font-bold tracking-widest text-lg">ADMIN</span>
                </div>

                <nav className="space-y-2 flex-1">
                    <Link to="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/admin') ? 'bg-[#D4AF37] text-black font-bold' : 'text-zinc-500 hover:text-white'}`}>
                        <LayoutDashboard size={20} /> <span className="text-xs uppercase tracking-widest">Overview</span>
                    </Link>
                    <Link to="/admin/users" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/admin/users') ? 'bg-[#D4AF37] text-black font-bold' : 'text-zinc-500 hover:text-white'}`}>
                        <Users size={20} /> <span className="text-xs uppercase tracking-widest">Users DB</span>
                    </Link>
                    <Link to="/admin/treasury" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/admin/treasury') ? 'bg-[#D4AF37] text-black font-bold' : 'text-zinc-500 hover:text-white'}`}>
                        <Wallet size={20} /> <span className="text-xs uppercase tracking-widest">Treasury</span>
                    </Link>
                </nav>

                <button onClick={() => window.location.href = '/app/studio'} className="mt-auto flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-white transition-colors">
                    <LogOut size={20} /> <span className="text-xs uppercase tracking-widest">Exit Admin</span>
                </button>
            </aside>

            {/* CONTENT AREA */}
            <main className="flex-1 bg-[#050505] overflow-y-auto">
                <Routes>
                    <Route path="/" element={<AdminConsole />} />
                    <Route path="/users" element={<UsersDatabase />} />
                    <Route path="/treasury" element={<TreasuryLogs />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
            </main>
        </div>
    );
}
