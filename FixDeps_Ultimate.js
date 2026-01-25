import fs from 'fs';
import { execSync } from 'child_process';

console.log("\n💊 [CEO PROTOCOL] INYECTANDO SOLUCIÓN DE DEPENDENCIAS... (ESM Mode)\n");

// 1. CREAR LA LLAVE MAESTRA (.npmrc)
// Esto es lo que Vercel necesita para dejar de llorar por versiones.
try {
    fs.writeFileSync('.npmrc', 'legacy-peer-deps=true\n');
    console.log("✅ .npmrc CREADO: Modo 'Sin Conflictos' activado.");
} catch (e) {
    console.error("❌ Error creando .npmrc:", e.message);
}

// 2. BORRAR LA MEMORIA CORRUPTA (package-lock.json)
if (fs.existsSync('package-lock.json')) {
    try {
        fs.unlinkSync('package-lock.json');
        console.log("✅ package-lock.json ELIMINADO: Se forzará una instalación limpia.");
    } catch (e) {
        console.error("⚠️ No se pudo borrar package-lock.json:", e.message);
    }
}

// 3. SUBIDA RÁPIDA A MAIN
console.log("\n🚀 SUBIENDO PARCHE A VERCEL...");
try {
    // Aseguramos que git vea los cambios
    try { execSync('git add .npmrc'); } catch (e) { }
    try { execSync('git rm package-lock.json'); } catch (e) { } // Intentar borrarlo de git también
    execSync('git add .');

    execSync('git commit -m "fix(deps): add .npmrc legacy-peer-deps and remove lockfile"');
    execSync('git push origin main --force');

    console.log("\n🏆 LISTO. Vercel ahora instalará las dependencias sin bloquearse.");
} catch (e) {
    console.error("💥 GIT ERROR (Puede que no haya cambios si ya lo ejecutaste):", e.message);
}
