
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ToastProvider, useToast } from './components/ui/Toast';
import { SidebarProvider, useSidebar } from './components/ui/sidebar';

// Pages & Components
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import MobileHeader from './components/MobileHeader';
import MobileNav from './components/MobileNav';

// Placeholder Imports (To prevent build errors if files are missing, we use standard imports)
import StudioConsole from './pages/admin/StudioConsole';
import ExplorePage from './pages/ExplorePage';
// import GalleryPage from './pages/GalleryPage'; // Se comenta por si causa conflicto, usaremos un inline si falla
import BillingPage from './pages/BillingPage';
import SettingsPage from './pages/SettingsPage';

// --- DEFINICIONES DE SOPORTE ---

const useMode = () => {
  const [mode, setMode] = useState('creator');
  return { mode, setMode };
};

// --- PROTECTED LAYOUT (LA PIEZA QUE FALTABA) ---
const ProtectedLayout = ({ session, credits, profile, mode, notify }: any) => {
  if (!session) {
      return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black overflow-hidden">
      <Sidebar credits={credits} mode={mode} />
      <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden">
        <MobileHeader credits={credits} />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black w-full relative scrollbar-hide">
          <Outlet context={{ credits, profile, notify }} />
        </main>
        <MobileNav />
      </div>
    </div>
  );
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
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Simple Gallery Page inline para evitar errores de importación
  const GalleryComponent = ({ videos }: any) => (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">My Gallery</h1>
      <p className="text-gray-400">Your generated videos will appear here.</p>
    </div>
  );

  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={!session ? <LoginScreen onLogin={() => {}} /> : <Navigate to="/app" />} />
        <Route path="/" element={<Navigate to={session ? "/app" : "/login"} />} />

        {/* Rutas Protegidas */}
        <Route path="/app" element={<ProtectedLayout session={session} credits={credits} profile={profile} mode={mode} notify={notify} />}>
          <Route index element={<StudioConsole credits={credits} setCredits={setCredits} notify={notify} />} />
          <Route path="studio" element={<StudioConsole credits={credits} setCredits={setCredits} notify={notify} />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="gallery" element={<GalleryComponent />} /> 
          <Route path="billing" element={<BillingPage onSelect={() => {}} />} />
          <Route path="settings" element={<SettingsPage profile={profile} notify={notify} />} />
        </Route>

        {/* Fallback */}
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
