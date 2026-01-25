import fs from 'fs';
import path from 'path';

console.log("\n🦅 [PHOENIX] INICIANDO FASE 3: GENERACIÓN DE CÓDIGO NÚCLEO...\n");

const createFile = (filePath, content) => {
    const absolutePath = path.resolve(filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content.trim());
    console.log(`✅ Generado: ${filePath}`);
};

// --- 1. ESTILOS GLOBALES ---
createFile('src/index.css', `
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;
}

body {
  @apply bg-black text-white antialiased font-sans;
  background-color: #000;
  color: #fff;
}

/* Scrollbar Hide */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
`);

// --- 2. TYPES ---
createFile('src/types/index.ts', `
export interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    credits: number;
}
`);

// --- 3. UI COMPONENTS (CORE) ---
createFile('src/modules/core/ui/Toast.tsx', `
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ToastContextType {
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast missing Provider");
    return ctx;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<{id: number, msg: string, type: string}[]>([]);
    
    const toast = (msg: string, type = 'success') => {
        const id = Date.now();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {createPortal(
                <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2">
                    {toasts.map(t => (
                        <div key={t.id} className={\`px-4 py-3 rounded-lg shadow-xl text-sm font-medium animate-in slide-in-from-right fade-in \${
                            t.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#1a1a1a] border border-[#333] text-white'
                        }\`}>
                            {t.msg}
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
};
`);

// --- 4. LAYOUT COMPONENT ---
createFile('src/modules/core/Layout.tsx', `
import React, { useState } from 'react';
import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';
import { LogOut, Video, LayoutGrid, ShoppingBag, Menu, X } from 'lucide-react';

interface LayoutProps {
    session: any;
}

export const Layout: React.FC<LayoutProps> = ({ session }) => {
    const [mobileMenu, setMobileMenu] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
         await supabase.auth.signOut();
         navigate('/login');
    };

    if (!session) return <Navigate to="/login" replace />;

    const NavItems = () => (
        <>
            <div className="mb-8 px-6 pt-6">
                <img src="/branding/logo-white.png" alt="MivideoAI" className="h-8 object-contain" onError={(e) => e.currentTarget.style.display='none'} />
                {!document.querySelector('img[src*="logo-white.png"]')?.complete && <h1 className="text-xl font-bold tracking-tighter">MIVIDEO<span className="text-blue-500">AI</span></h1>}
            </div>
            <nav className="flex-1 px-4 space-y-2">
                <NavLink to="/app/studio" className={({isActive}) => \`flex items-center gap-3 px-4 py-3 rounded-xl transition-all \${isActive ? 'bg-blue-600/10 text-blue-500 border border-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}\`}>
                    <Video size={20} /> <span className="font-medium">Studio</span>
                </NavLink>
                <NavLink to="/app/gallery" className={({isActive}) => \`flex items-center gap-3 px-4 py-3 rounded-xl transition-all \${isActive ? 'bg-blue-600/10 text-blue-500 border border-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}\`}>
                    <LayoutGrid size={20} /> <span className="font-medium">Gallery</span>
                </NavLink>
                <NavLink to="/app/marketplace" className={({isActive}) => \`flex items-center gap-3 px-4 py-3 rounded-xl transition-all \${isActive ? 'bg-blue-600/10 text-blue-500 border border-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}\`}>
                    <ShoppingBag size={20} /> <span className="font-medium">Marketplace</span>
                </NavLink>
            </nav>
            <div className="p-4 mt-auto border-t border-white/5">
                <button onClick={handleLogout} className="flex items-center gap-3 text-gray-400 hover:text-red-400 transition-colors w-full px-4 py-2">
                    <LogOut size={18} /> <span>Sign Out</span>
                </button>
            </div>
        </>
    );

    return (
        <div className="flex h-screen bg-black overflow-hidden relative">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col border-r border-white/10 bg-[#0A0A0A]">
                <NavItems />
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full z-50 bg-black/80 backdrop-blur border-b border-white/10 flex items-center justify-between p-4">
                 <span className="font-bold">MIVIDEOAI</span>
                 <button onClick={() => setMobileMenu(!mobileMenu)}><Menu /></button>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenu && (
                <div className="fixed inset-0 z-[100] bg-black">
                     <div className="absolute top-4 right-4"><button onClick={() => setMobileMenu(false)}><X /></button></div>
                     <NavItems />
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pt-16 md:pt-0 bg-black relative">
                <div className="max-w-7xl mx-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
`);

// --- 5. LOGIN COMPONENT ---
createFile('src/modules/auth/Login.tsx', `
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const signIn = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin + '/app' }
            });
            if (error) alert(error.message);
        } catch (e) {
            alert('Connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-black flex items-center justify-center relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative z-10 w-full max-w-sm p-8 bg-[#0A0A0A] border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl flex flex-col items-center text-center">
                 <div className="mb-8 w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="text-4xl">✨</span>
                 </div>
                 
                 <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                 <p className="text-gray-400 mb-8 text-sm">Sign in to access your dashboard</p>

                 <button 
                    onClick={signIn} 
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-white hover:bg-gray-100 text-black font-bold rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-3"
                 >
                    {loading ? (
                        <span className="animate-pulse">Connecting...</span>
                    ) : (
                        <>
                           <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c6.1 0 10.1-4.25 10.1-10.42c0-.72-.03-1.23-.08-1.48z"/></svg> 
                           Continue with Google
                        </>
                    )}
                 </button>
            </div>
            
            <div className="absolute bottom-8 text-xs text-gray-500 uppercase tracking-widest">Powered by Luxemotion</div>
        </div>
    );
};
`);

// --- 6. STUDIO COMPONENT ---
createFile('src/modules/studio/Studio.tsx', `
import React, { useState } from 'react';
import { useToast } from '@/modules/core/ui/Toast';

export const Studio = () => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleGen = () => {
        if (!prompt) return toast("Enter a prompt first", 'error');
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast("Creation initiated!", 'success');
        }, 1500);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <header>
                <h1 className="text-3xl font-bold mb-2">Create New Video</h1>
                <p className="text-gray-400">Transform your text into cinematic motion.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#0f0f0f] border border-white/5 p-6 rounded-2xl">
                        <label className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-4 block">Prompt</label>
                        <textarea 
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors h-40 resize-none" 
                            placeholder="A futuristic city with neon lights..."
                        />
                        <button 
                            onClick={handleGen}
                            disabled={loading}
                            className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all"
                        >
                            {loading ? 'Generating...' : 'Generate Video'}
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="aspect-video bg-[#0f0f0f] border border-white/5 rounded-2xl flex items-center justify-center text-gray-600">
                        <span className="text-sm">Preview Output</span>
                    </div>
                    
                    <div className="mt-8">
                        <h3 className="text-lg font-bold mb-4">Recent Creations</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[1,2,3].map(i => (
                                <div key={i} className="aspect-[9/16] bg-[#0f0f0f] rounded-xl border border-white/5 hover:border-white/20 transition-all cursor-pointer" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
`);

// --- 7. ENTRY POINTS (App.tsx & main.tsx) ---
createFile('src/App.tsx', `
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ToastProvider } from '@/modules/core/ui/Toast';
import { Layout } from '@/modules/core/Layout';
import { Login } from '@/modules/auth/Login';
import { Studio } from '@/modules/studio/Studio';

// Placeholders for other routes
const Marketplace = () => <div className="p-8 text-center text-gray-400">Marketplace Coming Soon</div>;
const Gallery = () => <div className="p-8 text-center text-gray-400">Gallery Empty</div>;

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
                        <Route path="gallery" element={<Gallery />} />
                    </Route>

                    <Route path="*" element={<Navigate to={session ? "/app/studio" : "/login"} />} />
                </Routes>
            </BrowserRouter>
        </ToastProvider>
    );
}

export default App;
`);

createFile('src/main.tsx', `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`);

console.log("✅ FASE 3 COMPLETADA: Código núcleo generado.");
console.log("👉 Listo para la compilación y lanzamiento.");
