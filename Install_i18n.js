import fs from 'fs';
import { execSync } from 'child_process';

console.log("\n🌍 [FIX] INSTALANDO SISTEMA DE IDIOMAS... (ESM Mode)\n");

// 1. AGREGAR DEPENDENCIAS FALTANTES A PACKAGE.JSON
try {
    const pkgPath = 'package.json';
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    // Inyectamos las librerías que pide el error de Vercel
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies["i18next"] = "^23.10.0";
    pkg.dependencies["react-i18next"] = "^14.1.0";

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log("✅ package.json actualizado con i18next.");
} catch (e) {
    console.error("❌ Error leyendo package.json:", e.message);
}

// 2. SUBIR LOS CAMBIOS
console.log("\n🚀 SUBIENDO A VERCEL...");
try {
    execSync('git add package.json', { stdio: 'inherit' });
    execSync('git commit -m "fix(build): add missing translation libraries"', { stdio: 'inherit' });
    execSync('git push origin main --force', { stdio: 'inherit' });
    console.log("\n🏆 LISTO. Ahora Vercel podrá construir la nueva versión.");
} catch (e) {
    console.error("GIT ERROR:", e.message);
}
