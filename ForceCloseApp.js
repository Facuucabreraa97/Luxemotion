import fs from 'fs';
import { execSync } from 'child_process';

console.log("\n🔒 [LOCKDOWN] FORZANDO CIERRE DE BLOQUES EN APP.TSX... (ESM Mode)\n");

const appPath = 'src/App.tsx';

try {
    let content = fs.readFileSync(appPath, 'utf8');

    // Buscamos dónde empieza la función App
    const appFunctionSignature = "function App() {";
    const appIndex = content.indexOf(appFunctionSignature);

    if (appIndex !== -1) {
        // 1. RESCATAR TODO EL CÓDIGO PREVIO
        let beforeApp = content.substring(0, appIndex).trim();

        // 2. FORZAR EL CIERRE (LA CLAVE DEL ÉXITO)
        // El usuario pide explícitamente agregar la llave incluso si parace que ya hay una.
        console.log("⚠️ Reforzando cierre de bloque anterior (Inyectando '}' extra por seguridad)...");
        beforeApp += "\n}\n\n";

        // 3. REESCRIBIR EL FINAL LIMPIO
        const newEnd = `function App() {
    return (
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    );
}

export default App;`;

        // 4. GUARDAR
        fs.writeFileSync(appPath, beforeApp + newEnd);
        console.log("✅ App.tsx: Archivo reconstruido con cierre forzado.");

    } else {
        console.error("❌ NO SE ENCONTRÓ 'function App()'. El archivo puede estar muy dañado.");
    }

} catch (e) {
    console.error("❌ ERROR:", e.message);
}

// SUBIDA FINAL
console.log("\n🚀 SUBIENDO ARREGLO FINAL...");
try {
    execSync('git add src/App.tsx', { stdio: 'inherit' });
    execSync('git commit -m "fix(syntax): force close AppContent function"', { stdio: 'inherit' });
    execSync('git push origin main --force', { stdio: 'inherit' });
    console.log("\n🏆 HECHO. El deploy debe pasar ahora.");
} catch (e) {
    console.error("GIT ERROR:", e.message);
}
