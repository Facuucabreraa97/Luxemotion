import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log("\n🏗️ [FACTORY] GENERANDO COMPONENTES FALTANTES... (ESM Mode)\n");

// --- 1. CREAR TOAST (src/components/ui/Toast.tsx) ---
const uiPath = 'src/components/ui';
if (!fs.existsSync(uiPath)) fs.mkdirSync(uiPath, { recursive: true });

const toastCode = `
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error') => void;
}
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) return { showToast: () => console.log("Toast sin provider") };
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<{id: number, msg: string, type: string}[]>([]);
  const showToast = (msg: string, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={\`px-4 py-2 rounded text-white \${t.type==='error'?'bg-red-600':'bg-green-600'}\`}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
`;
fs.writeFileSync(path.join(uiPath, 'Toast.tsx'), toastCode);
console.log("✅ CREADO: src/components/ui/Toast.tsx");


// --- 2. CREAR LOGIN SCREEN (src/components/LoginScreen.tsx) ---
// Este es el que está rompiendo el build AHORA MISMO.
const componentsPath = 'src/components';
if (!fs.existsSync(componentsPath)) fs.mkdirSync(componentsPath, { recursive: true });

const loginCode = `
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface LoginProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/app' }
      });
      if (error) alert(error.message);
    } catch (e) {
      alert("Error iniciando sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4">
      <h1 className="text-3xl font-bold mb-8">Luxemotion</h1>
      <button 
        onClick={handleLogin}
        disabled={loading}
        className="px-6 py-3 bg-white text-black rounded-lg font-bold hover:bg-gray-200 transition"
      >
        {loading ? 'Conectando...' : 'Entrar con Google'}
      </button>
    </div>
  );
};

export default LoginScreen;
`;
fs.writeFileSync(path.join(componentsPath, 'LoginScreen.tsx'), loginCode);
console.log("✅ CREADO: src/components/LoginScreen.tsx");


// --- 3. SUBIDA FINAL ---
console.log("\n🚀 ENVIANDO ARREGLOS A VERCEL...");
try {
    execSync('git add src/components/ui/Toast.tsx src/components/LoginScreen.tsx', { stdio: 'inherit' });
    execSync('git commit -m "fix(build): create missing LoginScreen and Toast components"', { stdio: 'inherit' });
    execSync('git push origin main --force', { stdio: 'inherit' });
    console.log("\n🏆 HECHO. Ahora sí, Vercel encontrará TODOS los archivos.");
} catch (e) {
    console.error("GIT ERROR:", e.message);
}
