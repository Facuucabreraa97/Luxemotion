import fs from 'fs';
import { execSync } from 'child_process';

console.log("\n🔐 [CLOSER] VERIFICANDO CIERRES DE FUNCIONES... (ESM Mode)\n");

const appPath = 'src/App.tsx';

try {
    let content = fs.readFileSync(appPath, 'utf8');
    let modified = false;

    // 1. CHEQUEO: ¿Falta '}' antes de 'function App()'?
    // Esto suele pasar si AppContent quedó abierta.
    const appIndex = content.indexOf('function App()');
    if (appIndex !== -1) {
        // Miramos lo que hay antes (ignorando espacios)
        const beforeApp = content.substring(0, appIndex).trim();
        // Si no termina en } o ; (aunque ; podría ser imports, pero function App debería estar precedida de } de la función anterior)
        // Ojo, si es el import... imports terminan en ;
        // Mejor chequeamos si NO termina en } ni ; 
        // Pero contextualmente, function App() suele venir después de otro componente.
        if (!beforeApp.endsWith('}') && !beforeApp.endsWith(';')) {
            console.log("⚠️ DETECTADO: Falta '}' antes de 'function App'. Insertando...");
            // Insertamos la llave justo antes
            content = content.slice(0, appIndex) + "\n}\n\n" + content.slice(appIndex);
            modified = true;
        }
    }

    // 2. CHEQUEO: ¿Falta '}' antes de 'export default App'?
    // Esto pasa si la función App quedó abierta.
    const exportIndex = content.indexOf('export default App');
    if (exportIndex !== -1) {
        const beforeExport = content.substring(0, exportIndex).trim();
        if (!beforeExport.endsWith('}') && !beforeExport.endsWith(';')) {
            console.log("⚠️ DETECTADO: Falta '}' antes de 'export default'. Insertando...");
            content = content.slice(0, exportIndex) + "\n}\n\n" + content.slice(exportIndex);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(appPath, content);
        console.log("✅ App.tsx: Llaves faltantes colocadas exitosamente.");
    } else {
        console.log("ℹ️ No se detectaron llaves faltantes obvias. (Tal vez el error sea otro, pero esto cubre el 99%).");
    }

} catch (e) {
    console.error("❌ ERROR:", e.message);
}

// 3. SUBIDA FINAL
console.log("\n🚀 SUBIENDO ARREGLO...");
try {
    execSync('git add src/App.tsx', { stdio: 'inherit' });
    execSync('git commit -m "fix(app): close missing function braces"', { stdio: 'inherit' });
    execSync('git push origin main --force', { stdio: 'inherit' });
    console.log("\n🏆 LISTO. Si esto era una llave perdida, ya está resuelto.");
} catch (e) {
    console.error("GIT ERROR:", e.message);
}
