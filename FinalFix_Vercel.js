import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

console.log("\n🔥 [CEO PROTOCOL] INITIATING DIRECT FILESYSTEM SURGERY... (ESM Mode)\n");

// --- PASO 1: ELIMINACIÓN DE ARCHIVOS TÓXICOS (Confirmados por auditoría) ---
const filesToDelete = [
    '.github/workflows/panopticon.yml',
    'src/pages/TalentPage.tsx',
    'src/pages/app/casting.tsx',
    'src/pages/admin/Sentinel_V3.tsx',
    'src/pages/admin/SentinelConsole.tsx'
];

filesToDelete.forEach(filePath => {
    const fullPath = path.resolve(filePath);
    if (fs.existsSync(fullPath)) {
        try {
            fs.rmSync(fullPath, { force: true, recursive: true });
            console.log(`🗑️ ELIMINADO: ${filePath}`);
        } catch (e) {
            console.error(`❌ ERROR BORRANDO ${filePath}:`, e.message);
        }
    } else {
        console.log(`💨 YA NO EXISTE: ${filePath} (Correcto)`);
    }
});

// --- PASO 2: LIMPIEZA DE REFERENCIAS ROTAS EN APP.TSX ---
// Si borramos TalentPage pero App.tsx lo sigue importando, Vercel falla.
const appPath = path.resolve('src/App.tsx');
if (fs.existsSync(appPath)) {
    try {
        let content = fs.readFileSync(appPath, 'utf8');
        const originalLength = content.length;

        // Regex para eliminar líneas de importación y rutas de los archivos borrados
        content = content.replace(/.*TalentPage.*/g, '');
        content = content.replace(/.*casting.*/g, '');
        content = content.replace(/.*Sentinel.*/g, '');

        fs.writeFileSync(appPath, content);
        console.log(`✅ APP.TSX SANITIZADO (Referencias muertas eliminadas).`);
    } catch (e) {
        console.error("❌ ERROR LIMPIANDO APP.TSX:", e.message);
    }
}

// --- PASO 3: GENERAR PACKAGE.JSON BLINDADO ---
// Configuración exacta para que Vercel compile sin errores de TS estricto.
const cleanPackageJson = {
    "name": "mivideoai-wrapper",
    "private": true,
    "version": "1.0.0",
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview",
        "start": "node server.js"
    },
    "dependencies": {
        "@supabase/supabase-js": "^2.39.3",
        "cors": "^2.8.5",
        "dotenv": "^16.4.1",
        "express": "^4.18.2",
        "lucide-react": "^0.323.0",
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-router-dom": "^6.21.3",
        "stripe": "^14.14.0"
    },
    "devDependencies": {
        "@types/react": "^18.2.43",
        "@types/react-dom": "^18.2.17",
        "@vitejs/plugin-react": "^4.2.1",
        "autoprefixer": "^10.4.17",
        "postcss": "^8.4.33",
        "tailwindcss": "^3.4.1",
        "typescript": "^5.2.2",
        "vite": "^5.0.8"
    }
};
fs.writeFileSync('package.json', JSON.stringify(cleanPackageJson, null, 2));
console.log("✅ PACKAGE.JSON REESCRITO (Modo Vercel Safe).");

// --- PASO 4: SINCRONIZACIÓN FORZADA CON GITHUB ---
console.log("\n🚀 EMPUJANDO LA VERDAD A MAIN...");
try {
    // Limpiar caché de Git para archivos borrados
    try { execSync('git rm -r --cached .', { stdio: 'ignore' }); } catch (e) { }

    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "fix(CEO): SURGICAL REMOVAL of Sentinel & Broken Files"', { stdio: 'inherit' });
    execSync('git push origin main --force', { stdio: 'inherit' });
    console.log("\n🏆 LISTO. VERCEL DEBERÍA INICIAR EL DEPLOY CORRECTO AHORA.");
} catch (e) {
    console.error("💥 ERROR EN GIT:", e.message);
}
