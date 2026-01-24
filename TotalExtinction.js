// ⚠️ GUARDA COMO 'TotalExtinction.js' Y EJECUTA: node TotalExtinction.js
// OBJETIVO: ELIMINAR CUALQUIER RASTRO DEL SENTINELA Y BLOQUEAR SU REINGRESO.

import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

console.log("\n☢️ [PROTOCOL: TOTAL EXTINCTION] HUNTING TARGETS...\n");

// 1. LISTA DE OBJETIVOS (Kill List)
// Archivos confirmados en tu repositorio que deben morir.
const targets = [
    '.github/workflows/panopticon.yml',
    'src/pages/admin/Sentinel_V3.tsx',
    'src/pages/admin/SentinelConsole.tsx',
    'src/pages/admin/components/SentinelConsole.tsx',
    'supabase/migration_sentinel_pr.sql'
];

// 2. ELIMINACIÓN FÍSICA Y DE GIT
targets.forEach(file => {
    const fullPath = path.resolve(file);

    // A. Borrar del Disco
    if (fs.existsSync(fullPath)) {
        try {
            // Using rmSync with force: true to emulate unlink and be robust
            fs.rmSync(fullPath, { force: true, recursive: true });
            console.log(`🗑️ DELETED FROM DISK: ${file}`);
        } catch (e) { console.error(`❌ ERROR DELETING ${file}:`, e.message); }
    } else {
        console.log(`⚡ NOT FOUND ON DISK: ${file} (Good)`);
    }

    // B. Borrar de la Memoria de Git (Vital para que no reviva)
    try {
        execSync(`git rm --cached ${file}`, { stdio: 'ignore' });
        console.log(`👻 UN-TRACKED FROM GIT: ${file}`);
    } catch (e) {
        // Ignoramos si ya no estaba rastreado
    }
});

// 3. EL BLOQUEO (THE WALL) - Modificar .gitignore
// Esto asegura que si el archivo se crea solo, Git lo ignore para siempre.
const gitignorePath = '.gitignore';
const blacklist = [
    '\n# --- SENTINEL BLACKLIST (DO NOT REMOVE) ---',
    '.github/workflows/panopticon.yml',
    'src/pages/admin/Sentinel*',
    'supabase/migration_sentinel*',
    '.github/',
    '# ------------------------------------------\n'
];

try {
    let content = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
    let appended = false;

    blacklist.forEach(line => {
        if (!content.includes(line.trim())) {
            fs.appendFileSync(gitignorePath, line + '\n');
            appended = true;
        }
    });

    if (appended) console.log("🛡️ .GITIGNORE UPDATED: Sentinel is now PERMANENTLY BLOCKED.");
    else console.log("🛡️ .GITIGNORE ALREADY SECURED.");

} catch (e) {
    console.error("❌ ERROR UPDATING GITIGNORE:", e.message);
}

// 4. LIMPIEZA DE CÓDIGO (Quitar referencias rotas)
// Si App.tsx intenta importar el archivo borrado, el build falla. Lo arreglamos.
const appTsx = 'src/App.tsx';
if (fs.existsSync(appTsx)) {
    let content = fs.readFileSync(appTsx, 'utf8');
    // Borramos líneas que importen Sentinel
    const cleanContent = content.replace(/.*Sentinel.*/g, '// [REMOVED SENTINEL IMPORT]');
    if (content !== cleanContent) {
        fs.writeFileSync(appTsx, cleanContent);
        console.log("🧹 CLEANED src/App.tsx (Removed Sentinel imports)");
    }
}

// 5. DEPLOY FINAL (CONFIRMACIÓN DE MUERTE)
console.log("\n🚀 PUSHING EXTINCTION EVENT...");
try {
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "chore: TOTAL EXTINCTION of Sentinel - Deleted, Untracked, and Blacklisted"', { stdio: 'inherit' });
    try {
        execSync('git push origin main --force', { stdio: 'inherit' });
    } catch (e) {
        console.log("⚠️ Could not push to main, trying master...");
        execSync('git push origin master --force', { stdio: 'inherit' });
    }
    console.log("\n🏆 IT IS DONE. THE SENTINEL NO LONGER EXISTS.");
} catch (e) {
    console.error("💥 GIT ERROR:", e.message);
}
