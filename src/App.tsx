import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

// Pages
import { LoginScreen } from './pages/LoginScreen';
import LandingWaitlist from './pages/LandingWaitlist';
import StudioConsole from './pages/app/studio/index';
import GalleryPage from './pages/app/gallery';
import ExplorePage from './pages/app/explore';
import BillingPage from './pages/app/plan';
import SettingsPage from './pages/app/settings';
import AdminLayout from './pages/admin/AdminLayout';

// Components
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import MobileHeader from './components/MobileHeader';

// --- PROTECTED LAYOUT ---
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="h-screen w-full bg-[#050505] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex h-screen bg-[#050505] overflow-hidden text-white font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full relative w-full">
                <MobileHeader />
                <main className="flex-1 overflow-y-auto overflow-x-hidden relative w-full scrollbar-hide pb-20 lg:pb-0">
                    {children}
                </main>
                <MobileNav />
            </div>
        </div>
    );
};

// --- MAIN ROUTER ---
export default function App() {
    return (
        <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<LandingWaitlist />} />
            <Route path="/login" element={<LoginScreen />} />

            {/* PROTECTED APP ROUTES */}
            <Route path="/app" element={<ProtectedLayout><Navigate to="/app/studio" replace /></ProtectedLayout>} />
            <Route path="/app/studio" element={<ProtectedLayout><StudioConsole /></ProtectedLayout>} />
            <Route path="/app/gallery" element={<ProtectedLayout><GalleryPage /></ProtectedLayout>} />
            <Route path="/app/explore" element={<ProtectedLayout><ExplorePage /></ProtectedLayout>} />
            <Route path="/app/plan" element={<ProtectedLayout><BillingPage /></ProtectedLayout>} />
            <Route path="/app/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />

            {/* ADMIN ROUTES */}
            <Route path="/admin/*" element={<AdminLayout />} />

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
