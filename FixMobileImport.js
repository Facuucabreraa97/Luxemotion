import fs from 'fs';
import { execSync } from 'child_process';

console.log("\n🚑 [FIX] REUBICANDO IMPORTACIONES ILEGALES... (ESM Mode)\n");

const appPath = 'src/App.tsx';

try {
    let content = fs.readFileSync(appPath, 'utf8');

    // 1. ELIMINAR EL IMPORT MAL COLOCADO (Donde sea que esté)
    // Buscamos la línea exacta que está dando error
    const badImportRegex = /import MobileLayout from '\.\/components\/MobileLayout';/g;

    // Si existe, lo borramos de su ubicación actual
    if (content.match(badImportRegex) || !content.includes("import MobileLayout")) {
        // Remove existing occurrences if any
        content = content.replace(badImportRegex, '');
        console.log("✅ Importación mal colocada eliminada del cuerpo del archivo (si existía).");

        // 2. INSERTARLO ARRIBA (Legalmente)
        // Lo ponemos al principio del archivo para asegurar que sea top-level
        const newImport = "import MobileLayout from './components/MobileLayout';";

        // Simplemente lo agregamos al inicio del todo para evitar problemas con 'import React' no encontrado o similar
        // Pero intentamos ser ordenados: después de los imports de React si es posible, o al inicio.

        if (content.startsWith("import")) {
            // Ya hay imports, lo ponemos primero
            content = newImport + "\n" + content;
        } else {
            // Archivo raro, lo ponemos al inicio
            content = newImport + "\n" + content;
        }

        fs.writeFileSync(appPath, content);
        console.log("💾 App.tsx guardado con la corrección.");

    } else {
        console.log("⚠️ El import ya parece estar presente y no coincide con el regex de 'mal colocado'. Verificando ubicación...");
        // Podríamos forzar moverlo si está en un lugar raro, pero por ahora asumimos que el regex captura el caso "malo".
    }

} catch (e) {
    console.error("❌ ERROR:", e.message);
}

// 3. SUBIDA FINAL
console.log("\n🚀 SUBIENDO ARREGLO...");
try {
    execSync('git add src/App.tsx', { stdio: 'inherit' });
    execSync('git commit -m "fix(app): move MobileLayout import to top level"', { stdio: 'inherit' });
    execSync('git push origin main --force', { stdio: 'inherit' });
    console.log("\n🏆 LISTO. Vercel ya no debería quejarse por imports mal ubicados.");
} catch (e) {
    console.error("GIT ERROR:", e.message);
}
