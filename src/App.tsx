import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { ToastProvider } from '@/modules/core/ui/Toast';
import { VideoGenerationProvider } from '@/context/VideoGenerationContext';
import { Toaster } from 'react-hot-toast';
import { Layout } from '@/modules/core/Layout';
import { Login } from '@/modules/auth/Login';
import { Studio } from '@/modules/studio/Studio';
import Profile from '@/pages/Profile';

import { Marketplace } from '@/pages/Marketplace';

// Placeholders for other routes
// const Marketplace = () => <div className="p-8 text-center text-gray-400">Marketplace Coming Soon</div>;

import { Plans } from '@/pages/Plans';

import { Landing } from '@/pages/Landing';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { UserService } from '@/services/user.service';
import { LanguageProvider } from '@/context/LanguageContext';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [whitelistStatus, setWhitelistStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingWhitelist, setCheckingWhitelist] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted) setSession(session);

        if (session?.user?.email) {
          // Parallelize checks for speed, but handle failures
          await Promise.allSettled([
            checkWhitelist(session.user.email),
            (async () => {
              try {
                const { data: profile, error: profileError } = await supabase
                  .from('profiles')
                  .select('is_admin')
                  .eq('id', session.user.id)
                  .single();
                if (profileError && profileError.code !== 'PGRST116')
                  console.error('Admin Check Error', profileError);
                if (mounted) setIsAdmin(!!profile?.is_admin);
              } catch (err) {
                console.error('Admin Check Failed', err);
              }
            })(),
          ]);
        }
      } catch (e) {
        console.error('Initialization Error', e);
      } finally {
        if (mounted) {
          setLoading(false);
          setCheckingWhitelist(false);
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) setSession(session);

      if (session?.user?.email) {
        if (mounted) setCheckingWhitelist(true);
        // We re-run checks on auth change
        Promise.allSettled([
          checkWhitelist(session.user.email),
          (async () => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('is_admin')
              .eq('id', session.user.id)
              .single();
            if (mounted) setIsAdmin(!!profile?.is_admin);
          })(),
        ]).finally(() => {
          if (mounted) {
            setLoading(false); // ensure global loading is off
            setCheckingWhitelist(false);
          }
        });
      } else {
        if (mounted) {
          setWhitelistStatus(null);
          setIsAdmin(false);
          setLoading(false);
          setCheckingWhitelist(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkWhitelist = async (email: string) => {
    const status = await UserService.checkWhitelist(email);
    setWhitelistStatus(status);
    setCheckingWhitelist(false);
  };

  // Global loading (initial boot) or Whitelist check (post-login race condition)
  if (loading || checkingWhitelist) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center text-white">
        Loading MivideoAI...
      </div>
    );
  }

  const isApprov = whitelistStatus === 'approved';

  // Gatekeeper Component
  const AdminRoute = ({ children }: { children: JSX.Element }) => {
    if (!session) return <Navigate to="/login" replace />;
    if (!isAdmin) return <Navigate to="/app/studio" replace />;
    return children;
  };

  return (
    <LanguageProvider>
    <ToastProvider>
      <BrowserRouter>
        <VideoGenerationProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/waitlist" element={<Landing />} />

            <Route
              path="/login"
              element={
                !session ? (
                  <Login />
                ) : isApprov ? (
                  <Navigate to="/app/studio" replace />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            <Route
              path="/app"
              element={
                session && isApprov ? <Layout session={session} /> : <Navigate to="/" replace />
              }
            >
              <Route index element={<Navigate to="/app/studio" replace />} />
              <Route path="studio" element={<Studio />} />
              <Route path="marketplace" element={<Marketplace />} />
              <Route path="gallery" element={<Profile />} />
              <Route path="billing" element={<Plans />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#333',
                color: '#fff',
              },
            }}
          />
        </VideoGenerationProvider>
      </BrowserRouter>
    </ToastProvider>
    </LanguageProvider>
  );
}

export default App;
