// ⚠️ GUARDA COMO 'CEO_Enforce.js' Y EJECUTA: node CEO_Enforce.js
// OBJETIVO: ESTABLECER AUTORIDAD DE RAMA MAIN Y LIMPIEZA FINAL.

import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

console.log("\n👔 [CEO ENFORCE PROTOCOL] ESTABLISHING MAIN AUTHORITY...\n");

try {
    // 1. ESTABLECER AUTORIDAD DE RAMA
    console.log("👉 1. BRANCH AUTHORITY");
    try {
        // Intentar switch a main, o crearla si no existe
        console.log("   - Switching to 'main'...");
        try { execSync('git checkout main', { stdio: 'pipe' }); }
        catch (e) { execSync('git checkout -b main', { stdio: 'pipe' }); }

        // Destruir master y production locales
        console.log("   - Destroying local 'master' and 'production'...");
        try { execSync('git branch -D master', { stdio: 'pipe' }); } catch (e) { }
        try { execSync('git branch -D production', { stdio: 'pipe' }); } catch (e) { }
    } catch (e) {
        console.log("   (Branch ops minor warning: " + e.message + ")");
    }

    // 2. ELIMINACIÓN FÍSICA DEL SENTINELA (Y SU FAMILIA)
    console.log("\n👉 2. FILE ELIMINATION");
    const killList = [
        '.github/workflows/panopticon.yml',
        'src/pages/TalentPage.tsx',
        'src/pages/app/casting.tsx',
        'src/pages/admin/Sentinel_V3.tsx',
        'src/pages/admin/SentinelConsole.tsx'
    ];
    killList.forEach(file => {
        const fullPath = path.resolve(file);
        if (fs.existsSync(fullPath)) {
            try {
                fs.rmSync(fullPath, { force: true, recursive: true });
                console.log(`   - Terminated: ${file}`);
            } catch (e) { console.log(`   - Failed to remove ${file}: ${e.message}`); }
        } else {
            console.log(`   - Clean: ${file} not found.`);
        }
    });

    // 3. REESCRITURA DE PACKAGE.JSON (EL CEREBRO)
    console.log("\n👉 3. PACKAGE.JSON ENFORCEMENT");
    const pkgContent = {
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
    fs.writeFileSync('package.json', JSON.stringify(pkgContent, null, 2));
    console.log("   - package.json overwritten per CEO spec.");

    // 4. LIMPIEZA DE APP.TSX (LAS CONEXIONES)
    console.log("\n👉 4. APP.TSX SANITIZATION");
    if (fs.existsSync('src/App.tsx')) {
        const appContent = fs.readFileSync('src/App.tsx', 'utf8');
        const lines = appContent.split(/\r?\n/);
        const filtered = lines.filter(line => {
            if (line.match(/TalentPage/)) return false;
            if (line.match(/casting/)) return false;
            if (line.match(/Sentinel/)) return false;
            return true;
        });

        if (filtered.length !== lines.length) {
            fs.writeFileSync('src/App.tsx', filtered.join('\n'));
            console.log(`   - Removed ${lines.length - filtered.length} lines containing banned references.`);
        } else {
            console.log("   - App.tsx is already clean.");
        }
    } else {
        console.log("   - App.tsx not found (unexpected but noted).");
    }

    // 5. EL GOLPE FINAL (PUSH DESTRUCTIVO)
    console.log("\n👉 5. FINAL PUSH ACTION");
    execSync('git add .', { stdio: 'inherit' });
    try {
        execSync('git commit -m "chore(CEO): ENFORCE MAIN AUTHORITY. Sentinel removed. Branches cleaned."', { stdio: 'inherit' });
    } catch (e) { console.log("   - No changes to commit."); }

    console.log("   - Pushing to MAIN...");
    try { execSync('git push origin HEAD:main --force', { stdio: 'inherit' }); }
    catch (e) { console.error("   - Push to main failed: " + e.message); }

    console.log("   - Deleting remote 'master'...");
    try { execSync('git push origin --delete master', { stdio: 'inherit' }); }
    catch (e) { console.log("   - Remote master already gone or failed (non-critical)."); }

    console.log("   - Deleting remote 'production'...");
    try { execSync('git push origin --delete production', { stdio: 'inherit' }); }
    catch (e) { console.log("   - Remote production already gone or failed (non-critical)."); }

    console.log("\n🏆 AUTHORITY ESTABLISHED. MAIN IS THE ONLY TRUTH.");

} catch (e) {
    console.error("💥 CRITICAL ERROR:", e.message);
}
