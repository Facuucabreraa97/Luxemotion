import fs from 'fs';
import { execSync } from 'child_process';

console.log("\n🧹 [CLEANUP] ELIMINANDO LLAVES DUPLICADAS EN APP.TSX... (ESM Mode)\n");

const appPath = 'src/App.tsx';

try {
    let content = fs.readFileSync(appPath, 'utf8');

    // PATRÓN DEL ERROR:
    // Buscamos dos llaves seguidas (con o sin espacios/saltos) justo antes de function App
    // Regex: "}" seguido de cualquier espacio en blanco, otro "}", espacio, "function App"
    const doubleBraceRegex = /\}\s*\}\s*function App/g;

    if (content.match(doubleBraceRegex)) {
        console.log("⚠️ DETECTADO: Doble cierre '}}' antes de App. Corrigiendo...");

        // REEMPLAZO: Dejamos solo UNA llave y saltos de línea limpios
        content = content.replace(doubleBraceRegex, "}\n\nfunction App");

        fs.writeFileSync(appPath, content);
        console.log("✅ App.tsx: Llave duplicada eliminada.");
    } else {
        console.log("ℹ️ No se detectó el patrón exacto '}} function App'. Buscando variantes...");

        // Intento manual por si el regex falla por saltos de línea raros
        const appIndex = content.indexOf('function App()');
        if (appIndex !== -1) {
            const before = content.substring(0, appIndex).trim();
            if (before.endsWith('}}')) {
                // Quitamos la última llave
                const fixedBefore = before.slice(0, -1);
                content = fixedBefore + "\n\n" + content.substring(appIndex);
                fs.writeFileSync(appPath, content);
                console.log("✅ App.tsx: Llave duplicada eliminada (Método manual).");
            } else {
                console.log("ℹ️ El contenido previo no termina en '}}'. No se requieren cambios (o el patrón es distinto).");
            }
        }
    }

} catch (e) {
    console.error("❌ ERROR:", e.message);
}

// SUBIDA FINAL
console.log("\n🚀 SUBIENDO ARREGLO...");
try {
    execSync('git add src/App.tsx', { stdio: 'inherit' });
    execSync('git commit -m "fix(syntax): remove redundant closing brace"', { stdio: 'inherit' });
    execSync('git push origin main --force', { stdio: 'inherit' });
    console.log("\n🏆 HECHO. Esto elimina el 'Unexpected }'.");
} catch (e) {
    console.error("GIT ERROR:", e.message);
}
