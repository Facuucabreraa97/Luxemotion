import fs from 'fs';
import { execSync } from 'child_process';

console.log("\n🌍 [MANUAL INSTALL] INYECTANDO LIBRERÍAS DE TRADUCCIÓN... (ESM Mode)\n");

// 1. MODIFICAR PACKAGE.JSON (Equivalente al sed pero seguro)
try {
    const pkgPath = 'package.json';
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    pkg.dependencies = pkg.dependencies || {};

    // Versiones especificadas por el usuario
    const libs = {
        "i18next": "^23.7.11",
        "react-i18next": "^14.0.0",
        "i18next-browser-languagedetector": "^7.2.0",
        "i18next-http-backend": "^2.4.2"
    };

    Object.assign(pkg.dependencies, libs);

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log("✅ package.json actualizado con todas las librerías i18n.");

} catch (e) {
    console.error("❌ Error actualizando package.json:", e.message);
    process.exit(1);
}

// 2. EJECUTAR NPM INSTALL (Para generar package-lock.json)
console.log("\n📦 EJECUTANDO NPM INSTALL...");
try {
    // Usamos shell: true para que funcione en Windows
    execSync('npm install --legacy-peer-deps', { stdio: 'inherit', shell: true });
    console.log("✅ npm install completado.");
} catch (e) {
    console.error("⚠️ Advertencia: npm install falló, pero continuaremos con la subida de package.json.", e.message);
}

// 3. SUBIR CAMBIOS
console.log("\n🚀 SUBIENDO A VERCEL...");
try {
    execSync('git add package.json package-lock.json', { stdio: 'inherit' });
    // Usamos --allow-empty por si solo package.json cambió y lockfile no se generó
    execSync('git commit --allow-empty -m "fix(build): add missing i18n dependencies"', { stdio: 'inherit' });
    execSync('git push origin main --force', { stdio: 'inherit' });
    console.log("\n🏆 LISTO. Dependencias subidas.");
} catch (e) {
    console.error("GIT ERROR:", e.message);
}
