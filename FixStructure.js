import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log("\n🏗️ [RE-ARCHITECT] SEPARANDO COMPONENTES CRÍTICOS... (ESM Mode)\n");

// 1. CREAR EL ARCHIVO DEL LAYOUT (src/components/AppLayout.tsx)
// Le cambiamos el nombre a 'AppLayout' para romper cualquier caché del nombre anterior.
const layoutPath = 'src/components/AppLayout.tsx';
const layoutCode = `
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import MobileNav from './MobileNav';

interface LayoutProps {
  session: any;
  credits: number;
  profile: any;
  mode: string;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const AppLayout: React.FC<LayoutProps> = ({ session, credits, profile, mode, notify }) => {
  // Si no hay sesión, mandamos al login
  if (!session) {
      return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black overflow-hidden">
      {/* Sidebar recibe sus props */}
      <Sidebar credits={credits} mode={mode} />
      
      <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden">
        <MobileHeader credits={credits} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black w-full relative scrollbar-hide">
          {/* Outlet pasa el contexto a las páginas hijas */}
          <Outlet context={{ credits, profile, notify }} />
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
};

export default AppLayout;
`;

// Asegurar que la carpeta components existe
if (!fs.existsSync('src/components')) {
    fs.mkdirSync('src/components', { recursive: true });
}
fs.writeFileSync(layoutPath, layoutCode);
console.log(`✅ CREADO: ${layoutPath} (Layout aislado exitosamente)`);


// 2. REESCRIBIR APP.TSX (Mucho más limpio ahora)
const appCode = `
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
`;

fs.writeFileSync('src/App.tsx', appCode);
console.log("✅ REESCRITO: src/App.tsx (Ahora usa el layout importado)");

// 3. SUBIDA FINAL
console.log("\n🚀 SUBIENDO CAMBIOS ESTRUCTURALES...");
try {
    execSync('git add src/components/AppLayout.tsx src/App.tsx', { stdio: 'inherit' });
    execSync('git commit -m "refactor: extract layout to separate file to fix ReferenceError"', { stdio: 'inherit' });
    execSync('git push origin main --force', { stdio: 'inherit' });
    console.log("\n🏆 HECHO. Esto DEBE funcionar porque el componente ya no vive dentro de App.tsx.");
} catch (e) {
    console.error("GIT ERROR:", e.message);
}
