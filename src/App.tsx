import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ToastProvider } from '@/modules/core/ui/Toast';
import { Layout } from '@/modules/core/Layout';
import { Login } from '@/modules/auth/Login';
import { Studio } from '@/modules/studio/Studio';
import Profile from '@/pages/Profile';

import { Marketplace } from '@/pages/Marketplace';

// Placeholders for other routes
// const Marketplace = () => <div className="p-8 text-center text-gray-400">Marketplace Coming Soon</div>;

import { Landing } from '@/pages/Landing';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { UserService } from '@/services/user.service';

function App() {
    const [session, setSession] = useState<any>(null);
    const [whitelistStatus, setWhitelistStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user?.email) checkWhitelist(session.user.email);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user?.email) {
            await checkWhitelist(session.user.email);
        } else {
            setLoading(false);
        }
    };

    const checkWhitelist = async (email: string) => {
        const status = await UserService.checkWhitelist(email);
        setWhitelistStatus(status);
        setLoading(false);
    };

    if (loading) return <div className="h-screen w-full bg-black flex items-center justify-center text-white">Loading MivideoAI...</div>;

    const isApprov = whitelistStatus === 'approved';

    return (
        <ToastProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Landing />} />

                    <Route path="/login" element={
                        !session ? <Login /> : (isApprov ? <Navigate to="/app/studio" /> : <Navigate to="/" />)
                    } />

                    <Route path="/admin" element={
                        session && isApprov ? <AdminDashboard /> : <Navigate to="/login" />
                    } />

                    <Route path="/app" element={
                        session && isApprov ? <Layout session={session} /> : <Navigate to="/" />
                    }>
                        <Route index element={<Navigate to="/app/studio" />} />
                        import {Plans} from '@/pages/Plans';

                        // ... imports

                        // ... inside Layout Route
                        <Route path="studio" element={<Studio />} />
                        <Route path="marketplace" element={<Marketplace />} />
                        <Route path="gallery" element={<Profile />} />
                        <Route path="billing" element={<Plans />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </BrowserRouter>
        </ToastProvider>
    );
}

export default App;