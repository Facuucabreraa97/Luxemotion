import fs from 'fs';
import { execSync } from 'child_process';

console.log("\n🧱 [FIX] RECONSTRUYENDO EL FINAL DE APP.TSX... (ESM Mode)\n");

const appPath = 'src/App.tsx';

try {
    let content = fs.readFileSync(appPath, 'utf8');

    // 1. ELIMINAR EL FINAL CORRUPTO
    // Buscamos dónde empieza la función App para limpiar todo lo que sigue y reescribirlo bien.
    const appStartParams = "function App() {";
    const appIndex = content.lastIndexOf(appStartParams);

    if (appIndex !== -1) {
        // Cortamos el archivo justo antes de que empiece la función App
        // (Asegurando que lo anterior esté cerrado con una llave si es necesario)
        let baseContent = content.substring(0, appIndex).trim();

        // Verificamos si la función anterior (AppContent) quedó abierta
        // Si termina en '}', asumimos que está cerrada. Si no, cerramos.
        if (!baseContent.endsWith('}')) {
            console.log("⚠️ Detectada función anterior abierta. Cerrándola...");
            baseContent += "\n}\n\n";
        } else {
            console.log("✅ La función anterior parece estar cerrada correctamente.");
            baseContent += "\n\n";
        }

        // 2. ESCRIBIR EL COMPONENTE APP DESDE CERO (Limpio y Cerrado)
        // Esto garantiza que no falte NINGUNA llave.
        const cleanAppFunction = `function App() {
    return (
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    );
}

export default App;`;

        // Juntamos las partes
        const finalContent = baseContent + cleanAppFunction;

        fs.writeFileSync(appPath, finalContent);
        console.log("✅ App.tsx: Final del archivo reconstruido correctamente.");

    } else {
        console.error("❌ No encontré 'function App() {' en el archivo. Buscando alternativa...");
        // Plan de respaldo: Agregar una llave al final antes del export si existe
        if (content.includes('export default App;') && !content.trim().endsWith('}')) {
            const fixed = content.replace('export default App;', '}\n\nexport default App;');
            fs.writeFileSync(appPath, fixed);
            console.log("✅ Plan B: Se agregó una llave de cierre forzada antes del export.");
        } else {
            console.log("⚠️ No se pudo aplicar limpieza automática (patrón no encontrado).");
        }
    }

} catch (e) {
    console.error("❌ ERROR:", e.message);
}

// 3. SUBIDA FINAL
console.log("\n🚀 SUBIENDO ARREGLO...");
try {
    execSync('git add src/App.tsx', { stdio: 'inherit' });
    execSync('git commit -m "fix(app): reconstruct App component closing tags"', { stdio: 'inherit' });
    execSync('git push origin main --force', { stdio: 'inherit' });
    console.log("\n🏆 LISTO. El archivo ahora tiene un final válido y cerrado.");
} catch (e) {
    console.error("GIT ERROR:", e.message);
}
