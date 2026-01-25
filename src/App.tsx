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

function App() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) return <div className="h-screen w-full bg-black flex items-center justify-center text-white">Loading MivideoAI...</div>;

    return (
        <ToastProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={!session ? <Login /> : <Navigate to="/app/studio" />} />

                    <Route path="/app" element={<Layout session={session} />}>
                        <Route index element={<Navigate to="/app/studio" />} />
                        <Route path="studio" element={<Studio />} />
                        <Route path="marketplace" element={<Marketplace />} />
                        <Route path="gallery" element={<Profile />} />
                    </Route>

                    <Route path="*" element={<Navigate to={session ? "/app/studio" : "/login"} />} />
                </Routes>
            </BrowserRouter>
        </ToastProvider>
    );
}

export default App;