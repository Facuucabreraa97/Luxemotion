import React, { useState } from 'react';
import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';
import { LogOut, Video, LayoutGrid, ShoppingBag } from 'lucide-react';

interface LayoutProps {
  session: any;
}

export const Layout: React.FC<LayoutProps> = ({ session }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/waitlist');
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
            <h1 className="text-xl font-bold tracking-tighter">
              MIVIDEO<span className="text-blue-500">AI</span>
            </h1>
          )}
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <NavLink
            to="/app/studio"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600/10 text-blue-500 border border-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`
            }
          >
            <Video size={20} /> <span className="font-medium">Studio</span>
          </NavLink>
          <NavLink
            to="/app/gallery"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600/10 text-blue-500 border border-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`
            }
          >
            <LayoutGrid size={20} /> <span className="font-medium">Gallery</span>
          </NavLink>
          <NavLink
            to="/app/marketplace"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600/10 text-blue-500 border border-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`
            }
          >
            <ShoppingBag size={20} /> <span className="font-medium">Marketplace</span>
          </NavLink>
        </nav>
        <div className="p-4 mt-auto border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-gray-400 hover:text-red-400 transition-colors w-full px-4 py-2"
          >
            <LogOut size={18} /> <span>Sign Out</span>
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden relative">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/10 bg-[#0A0A0A]">
        <NavItems />
      </aside>

      <div className="md:hidden fixed top-0 w-full z-40 bg-black/80 backdrop-blur-md border-b border-white/5 flex items-center justify-center p-4">
        <img src="/branding/logo-white.png" alt="MivideoAI" className="h-6" />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 pb-24 md:pt-0 md:pb-0 bg-black relative scroll-smooth">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Dock */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
        <nav className="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex justify-around items-center p-1">
          <NavLink
            to="/app/studio"
            className={({ isActive }) =>
              `p-3 rounded-xl transition-all ${isActive ? 'bg-white text-black shadow-lg scale-105' : 'text-gray-500'}`
            }
          >
            <Video size={20} />
          </NavLink>
          <NavLink
            to="/app/gallery"
            className={({ isActive }) =>
              `p-3 rounded-xl transition-all ${isActive ? 'bg-white text-black shadow-lg scale-105' : 'text-gray-500'}`
            }
          >
            <LayoutGrid size={20} />
          </NavLink>
          <NavLink
            to="/app/marketplace"
            className={({ isActive }) =>
              `p-3 rounded-xl transition-all ${isActive ? 'bg-white text-black shadow-lg scale-105' : 'text-gray-500'}`
            }
          >
            <ShoppingBag size={20} />
          </NavLink>
          <button onClick={handleLogout} className="p-3 text-red-500/50 hover:text-red-500">
            <LogOut size={20} />
          </button>
        </nav>
      </div>
    </div>
  );
};
