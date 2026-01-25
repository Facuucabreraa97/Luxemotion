
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ToastProvider, useToast } from './components/ui/Toast';

// Componentes
import LoginScreen from './components/LoginScreen';
import AppLayout from './components/AppLayout'; // <--- IMPORTAMOS EL NUEVO LAYOUT

// Pages
import StudioConsole from './pages/admin/StudioConsole';
import ExplorePage from './pages/ExplorePage';
import BillingPage from './pages/BillingPage';
import SettingsPage from './pages/SettingsPage';

// Helper
const useMode = () => {
  const [mode, setMode] = useState('creator');
  return { mode, setMode };
};

// --- APP CONTENT ---
function AppContent() {
  const [session, setSession] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [profile, setProfile] = useState<any>({ name: "User", plan: 'starter' });
  const { mode } = useMode();
  const { showToast } = useToast();
  
  const notify = (msg: string, type: 'success' | 'error' = 'success') => showToast(msg, type);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Stub simple para evitar errores si falta el archivo de galería
  const GalleryStub = () => <div className="p-10 text-white">Gallery Loading...</div>;

  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={!session ? <LoginScreen onLogin={() => {}} /> : <Navigate to="/app" />} />
        <Route path="/" element={<Navigate to={session ? "/app" : "/login"} />} />

        {/* Rutas Protegidas usando el nuevo AppLayout */}
        <Route path="/app" element={<AppLayout session={session} credits={credits} profile={profile} mode={mode} notify={notify} />}>
          <Route index element={<StudioConsole credits={credits} setCredits={setCredits} notify={notify} />} />
          <Route path="studio" element={<StudioConsole credits={credits} setCredits={setCredits} notify={notify} />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="gallery" element={<GalleryStub />} />
          <Route path="billing" element={<BillingPage onSelect={() => {}} />} />
          <Route path="settings" element={<SettingsPage profile={profile} notify={notify} />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/app" />} />
      </Routes>
    </Router>
  );
}

// --- MAIN APP ---
function App() {
  return (
    <ToastProvider>
        <AppContent />
    </ToastProvider>
  );
}

export default App;
