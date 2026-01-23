import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginScreen } from './pages/LoginScreen';
import LandingWaitlist from './pages/LandingWaitlist';
import StudioConsole from './pages/app/studio/index'; // The new Studio
import GalleryPage from './pages/app/gallery'; // The Unified Gallery
import ExplorePage from './pages/app/explore';
import BillingPage from './pages/app/plan';
import SettingsPage from './pages/app/settings';
import AdminLayout from './pages/admin/AdminLayout';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import MobileHeader from './components/MobileHeader';
import { supabase } from './lib/supabase';
import { ToastProvider, useToast } from './context/ToastContext';
import { ModeProvider, useMode } from './context/ModeContext';
import { ActivateAccount } from './pages/ActivateAccount';

// PROTECTED LAYOUT (THE SHELL)
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [profile, setProfile] = React.useState<any>(null);

    React.useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => setProfile(data));
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, []);

    if (loading) return <div className="h-screen bg-black flex items-center justify-center text-[#D4AF37] font-bold tracking-widest animate-pulse">LOADING LUXEMOTION...</div>;
    if (!session) return <Navigate to="/login" replace />;

    return (
        <div className="flex h-screen bg-[#050505] overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full relative">
                <MobileHeader credits={profile?.credits || 0} userProfile={profile} onUpgrade={() => { }} />
                <main className="flex-1 overflow-y-auto overflow-x-hidden relative w-full">
                    {children}
                </main>
                <MobileNav />
            </div>
        </div>
    );
};

function AppContent() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingWaitlist />} />
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/register" element={<LoginScreen />} />
                <Route path="/activate-account" element={<ActivateAccount />} />

                {/* APP ROUTES */}
                <Route path="/app" element={<ProtectedLayout><Navigate to="/app/studio" replace /></ProtectedLayout>} />
                <Route path="/app/studio" element={<ProtectedLayout><StudioConsole /></ProtectedLayout>} />
                <Route path="/app/gallery" element={<ProtectedLayout><GalleryPage /></ProtectedLayout>} />
                <Route path="/app/explore" element={<ProtectedLayout><ExplorePage /></ProtectedLayout>} />
                <Route path="/app/plan" element={<ProtectedLayout><BillingPage /></ProtectedLayout>} />
                <Route path="/app/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />

                {/* ADMIN ROUTES */}
                <Route path="/admin/*" element={<AdminLayout />} />

                {/* 404 CATCH ALL */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default function App() {
    return (
        <ModeProvider>
            <ToastProvider>
                <AppContent />
            </ToastProvider>
        </ModeProvider>
    );
}
