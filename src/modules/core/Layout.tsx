import React, { useState } from 'react';
import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';
import { LogOut, Video, LayoutGrid, ShoppingBag, Menu, X } from 'lucide-react';

interface LayoutProps {
    session: any;
}

export const Layout: React.FC<LayoutProps> = ({ session }) => {
    const [mobileMenu, setMobileMenu] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    if (!session) return <Navigate to="/login" replace />;

    const NavItems = () => {
        const [imgError, setImgError] = useState(false);
        return (
            <>
                <div className="mb-8 px-6 pt-6">
                    {!imgError ? (
                        <img
                            src="/branding/logo-white.png"
                            alt="MivideoAI"
                            className="h-8 object-contain"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <h1 className="text-xl font-bold tracking-tighter">MIVIDEO<span className="text-blue-500">AI</span></h1>
                    )}
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <NavLink to="/app/studio" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600/10 text-blue-500 border border-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                        <Video size={20} /> <span className="font-medium">Studio</span>
                    </NavLink>
                    <NavLink to="/app/gallery" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600/10 text-blue-500 border border-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                        <LayoutGrid size={20} /> <span className="font-medium">Gallery</span>
                    </NavLink>
                    <NavLink to="/app/marketplace" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600/10 text-blue-500 border border-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                        <ShoppingBag size={20} /> <span className="font-medium">Marketplace</span>
                    </NavLink>
                </nav>
                <div className="p-4 mt-auto border-t border-white/5">
                    <button onClick={handleLogout} className="flex items-center gap-3 text-gray-400 hover:text-red-400 transition-colors w-full px-4 py-2">
                        <LogOut size={18} /> <span>Sign Out</span>
                    </button>
                </div>
            </>
        );

        return (
            <div className="flex h-screen bg-black overflow-hidden relative">
                {/* Desktop Sidebar */}
                <aside className="hidden md:flex w-64 flex-col border-r border-white/10 bg-[#0A0A0A]">
                    <NavItems />
                </aside>

                {/* Mobile Header */}
                <div className="md:hidden fixed top-0 w-full z-50 bg-black/80 backdrop-blur border-b border-white/10 flex items-center justify-between p-4">
                    <span className="font-bold">MIVIDEOAI</span>
                    <button onClick={() => setMobileMenu(!mobileMenu)}><Menu /></button>
                </div>

                {/* Mobile Menu Overlay */}
                {mobileMenu && (
                    <div className="fixed inset-0 z-[100] bg-black">
                        <div className="absolute top-4 right-4"><button onClick={() => setMobileMenu(false)}><X /></button></div>
                        <NavItems />
                    </div>
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto pt-16 md:pt-0 bg-black relative">
                    <div className="max-w-7xl mx-auto p-4 md:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        );
    };