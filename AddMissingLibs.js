import fs from 'fs';
import { execSync } from 'child_process';

console.log("\n🌍 [CEO PROTOCOL] INSTALANDO MOTORES DE IDIOMA... (ESM Mode)\n");

// 1. LEER Y PARCHEAR PACKAGE.JSON
// No lo reescribimos todo para no romper lo que ya arreglamos. Solo inyectamos lo que falta.
try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    // Agregamos las librerías faltantes
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies["i18next"] = "^23.10.0";
    pkg.dependencies["react-i18next"] = "^14.1.0";

    // Guardamos
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    console.log("✅ package.json ACTUALIZADO: Se agregaron i18next y react-i18next.");
} catch (e) {
    console.error("❌ Error leyendo package.json:", e.message);
}

// 2. SUBIDA RÁPIDA
console.log("\n🚀 SUBIENDO CAMBIOS A VERCEL...");
try {
    execSync('git add package.json', { stdio: 'inherit' });
    execSync('git commit -m "fix(build): add missing i18next dependencies"', { stdio: 'inherit' });
    execSync('git push origin main --force', { stdio: 'inherit' });
    console.log("\n🏆 LISTO. Vercel encontrará las librerías y terminará el build.");
} catch (e) {
    console.error("💥 GIT ERROR:", e.message);
}
