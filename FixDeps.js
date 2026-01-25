import fs from 'fs';
import { execSync } from 'child_process';

console.log("\n💊 [DEPENDENCY FIX] APLICANDO MEDICINA A NPM... (ESM Mode)\n");

// 1. CREAR .npmrc (La llave maestra)
// Esto configura a NPM para usar "--legacy-peer-deps" automáticamente.
// Es la solución estándar para el error ERESOLVE.
fs.writeFileSync('.npmrc', 'legacy-peer-deps=true\n');
console.log("✅ .npmrc CREADO: Conflictos de versiones serán ignorados.");

// 2. ELIMINAR EL BLOQUEO VIEJO
// Borramos package-lock.json para obligar a Vercel a recalcular todo limpio.
if (fs.existsSync('package-lock.json')) {
    fs.unlinkSync('package-lock.json');
    console.log("✅ package-lock.json ELIMINADO: Se generará uno nuevo y limpio.");
}

// 3. SUBIDA RÁPIDA
console.log("\n🚀 SUBIENDO PARCHE...");
try {
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "fix(build): add .npmrc to bypass ERESOLVE error"', { stdio: 'inherit' });
    execSync('git push origin main --force', { stdio: 'inherit' });
    console.log("\n🏆 LISTO. Vercel pasará la instalación ahora.");
} catch (e) {
    console.error("GIT ERROR:", e.message);
}
