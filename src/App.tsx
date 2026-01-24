import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './pages/LoginScreen';
import LandingWaitlist from './pages/LandingWaitlist';
import StudioConsole from './pages/app/studio/index';
import GalleryPage from './pages/app/gallery';
import ExplorePage from './pages/app/explore';
import BillingPage from './pages/app/plan';
import SettingsPage from './pages/app/settings';
import AdminLayout from './pages/admin/AdminLayout';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import MobileHeader from './components/MobileHeader';
import { supabase } from './lib/supabase';

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
        return () => subscription.unsubscribe();
    }, []);

    if (loading) return <div className="h-screen bg-black flex items-center justify-center text-[#D4AF37]">LOADING...</div>;
    if (!session) return <Navigate to="/login" replace />;

    return (
        <div className="flex h-screen bg-[#050505] overflow-hidden text-white font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full w-full relative">
                <MobileHeader />
                <main className="flex-1 overflow-y-auto w-full pb-20 lg:pb-0 relative">{children}</main>
                <MobileNav />
            </div>
        </div>
    );
};

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingWaitlist />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/app" element={<ProtectedLayout><Navigate to="/app/studio" replace /></ProtectedLayout>} />
            <Route path="/app/studio" element={<ProtectedLayout><StudioConsole /></ProtectedLayout>} />
            <Route path="/app/gallery" element={<ProtectedLayout><GalleryPage /></ProtectedLayout>} />
            <Route path="/app/explore" element={<ProtectedLayout><ExplorePage /></ProtectedLayout>} />
            <Route path="/app/plan" element={<ProtectedLayout><BillingPage /></ProtectedLayout>} />
            <Route path="/app/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />
            <Route path="/admin/*" element={<AdminLayout />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
