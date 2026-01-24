// ⚠️ GUARDA COMO 'OmniReset.js' Y EJECUTA: node OmniReset.js
// OBJETIVO: Borrar historia corrupta, reescribir código y forzar deploy limpio a 'main'.

import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("\n☢️ [PROTOCOL: OMNI-RESET] INITIATING NUCLEAR DEPLOY...\n");

// --- PASO 0: CAPTURAR LA URL DEL REPO (Antes de borrar .git) ---
let remoteUrl = '';
try {
    remoteUrl = execSync('git config --get remote.origin.url').toString().trim();
    console.log(`🔗 REMOTE URL DETECTED: ${remoteUrl}`);
} catch (e) {
    console.error("❌ CRITICAL: Could not read remote URL. Make sure you are in a git repo.");
    // If we can't find remote, we might still want to proceed if the user wants to force reset, 
    // but the script says exit. I will respect the script logic.
    // However, if the .git folder is already gone from a previous run, this will fail.
    // But since this is a recovery script, I should probably allow providing a manual URL or assume it works.
    // Given the error previously was just syntax, the git repo should still be there.
    process.exit(1);
}

// --- PASO 1: LIMPIEZA DE ARCHIVOS BASURA (Fantasmas) ---
const trash = [
    '.git', // <--- NUCLEAR OPTION: Borramos la historia corrupta
    '.github',
    'src/pages/app/casting.tsx',
    'src/pages/TalentPage.tsx',
    'src/pages/admin/Sentinel_V3.tsx'
];
trash.forEach(p => {
    const fullPath = path.resolve(p);
    if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`🗑️ DESTROYED: ${p}`);
    }
});

// --- PASO 2: REESCRITURA DEL CÓDIGO MAESTRO (Asegurar que el código es el NUEVO) ---

// A. PACKAGE.JSON (Fix Crash)
try {
    if (fs.existsSync('package.json')) {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.type = "module";
        pkg.scripts.build = "vite build";
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        console.log("✅ CODE: package.json Fixed");
    }
} catch (e) { }

// B. SERVER.JS (85/10/5 Logic)
const serverCode = `
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// --- ECONOMIC ENGINE (85/10/5) ---
app.post('/api/market/buy', async (req, res) => {
    const { price } = req.body;
    const fee = price * 0.05;
    const royalty = price * 0.10;
    const seller = price * 0.85;
    console.log(\`[TX] Split: Seller \${seller} | Royalty \${royalty} | Fee \${fee}\`);
    res.json({ success: true, message: "Ownership Transferred (Wrapper Protocol)" });
});

app.post('/api/studio/generate', async (req, res) => {
    res.json({ outputUrl: "https://placehold.co/600x400/1a1a1a/D4AF37?text=HQ+Wrapper+Asset" });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(port, () => console.log('mivideoAI Core running on port ' + port));
`;
fs.writeFileSync('server.js', serverCode);
console.log("✅ CODE: server.js Written");

// C. UI (Unified Gallery & Branding)
const sidebarCode = `
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, Image as ImageIcon, CreditCard, Settings, LayoutGrid, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Sidebar() {
  const navItems = [
    { icon: Sparkles, label: 'Studio', path: '/app/studio' },
    { icon: ImageIcon, label: 'Gallery', path: '/app/gallery' },
    { icon: LayoutGrid, label: 'Explore', path: '/app/explore' },
    { icon: CreditCard, label: 'Plan', path: '/app/plan' },
    { icon: Settings, label: 'Settings', path: '/app/settings' },
  ];
  return (
    <div className="hidden lg:flex flex-col w-[280px] h-full bg-[#050505] border-r border-white/5 p-6">
      <div className="mb-12 px-2">
        <h1 className="text-xl font-bold text-white tracking-widest text-[#D4AF37]">MIVIDEOAI</h1>
        <p className="text-[10px] text-zinc-600 uppercase tracking-[0.3em]">WRAPPER</p>
      </div>
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map(i => (
          <NavLink key={i.path} to={i.path} className={({isActive}) => \`flex items-center gap-3 px-4 py-3 rounded-xl transition-all \${isActive ? 'bg-white/5 text-[#D4AF37] border border-[#D4AF37]/20' : 'text-zinc-500 hover:text-white'}\`}>
            <i.icon size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">{i.label}</span>
          </NavLink>
        ))}
      </nav>
      <button onClick={() => supabase.auth.signOut().then(() => window.location.href='/login')} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-900/10 rounded-xl mt-auto"><LogOut size={18}/><span className="text-xs font-bold uppercase tracking-widest">Logout</span></button>
    </div>
  );
}
`;
fs.writeFileSync('src/components/Sidebar.tsx', sidebarCode);
console.log("✅ CODE: Sidebar.tsx Written");

// --- PASO 3: RE-INICIALIZACIÓN DE GIT (Clean Slate) ---
console.log("\n🔄 RE-INITIALIZING GIT...");
try {
    execSync('git init', { stdio: 'inherit' });
    execSync(`git remote add origin ${remoteUrl}`, { stdio: 'inherit' });
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "feat(OMNI-RESET): Fresh start with mivideoAI core"', { stdio: 'inherit' });

    console.log("\n🚀 FORCE PUSHING TO MAIN...");
    // Attempting push to main (or master if existing)
    try {
        execSync('git push origin main --force', { stdio: 'inherit' });
    } catch (e) {
        console.log("⚠️ Could not push to main, trying master...");
        execSync('git push origin master --force', { stdio: 'inherit' });
    }

    console.log("\n🏆 SUCCESS. HISTORY WIPED. NEW CODE IS LIVE.");
} catch (e) {
    console.error("💥 GIT ERROR:", e.message);
}
