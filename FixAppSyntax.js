import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log("\n🔪 [SURGERY] EXTIRPANDO CÓDIGO ZOMBIE EN APP.TSX... (ESM Mode)\n");

const appPath = 'src/App.tsx';

try {
    let content = fs.readFileSync(appPath, 'utf8');

    // ENCONTRAR EL BLOQUE CORRUPTO
    // El bloque huérfano empieza con hooks sueltos después de LoginScreen
    // Buscamos patrones únicos de ese bloque basura.

    // Marcador de inicio (aproximado, donde termina LoginScreen)
    const startMarker = /const LoginScreen =[\s\S]*?};\s*(?=const { mode } = useMode)/;

    // Marcador de fin (donde empieza GalleryPage)
    const endMarker = /const GalleryPage =/;

    // Verificamos si existe el bloque corrupto
    if (content.match(/const { mode } = useMode/)) {
        console.log("⚠️ DETECTADO: Bloque huérfano (código de TalentPage sin declarar).");

        // ESTRATEGIA: Leer el archivo línea por línea para ser precisos
        const lines = content.split('\n');
        const newLines = [];
        let inZombieZone = false;
        let zombieFound = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Detectar inicio de la zona zombie (justo después de LoginScreen)
            // La zona zombie empieza con "const { mode } = useMode();" SIN estar dentro de una función
            // Mejor detección: Si encontramos "const { mode } = useMode();" y NO estamos identados o parece root level
            if (line.trim().startsWith('const { mode } = useMode();') && !inZombieZone) {
                // Chequeo de seguridad: asegurar que no estamos dentro de Sidebar o App
                // Miramos las líneas anteriores. Si la anterior es "};", es probable que sea el zombie.
                if (i > 0 && lines[i - 1].trim() === '};') {
                    console.log(`🔻 Inicio de zona zombie detectado en línea ${i + 1}`);
                    inZombieZone = true;
                    zombieFound = true;
                }
            }

            // Detectar fin de la zona zombie (cuando empieza GalleryPage)
            if (inZombieZone && line.trim().startsWith('const GalleryPage =')) {
                console.log(`🔺 Fin de zona zombie detectado en línea ${i + 1}`);
                inZombieZone = false;
                // No consumimos esta linea, ya que es el inicio de GalleryPage
            }

            // Si NO estamos en la zona zombie, guardamos la línea
            if (!inZombieZone) {
                newLines.push(line);
            }
        }

        if (zombieFound) {
            const cleanedContent = newLines.join('\n');
            fs.writeFileSync(appPath, cleanedContent);
            console.log("✅ App.tsx: Código zombie eliminado exitosamente.");
        } else {
            console.log("ℹ️ No se detectó el patrón exacto por líneas. Intentando Regex...");
            // Plan B: Reemplazo por regex del bloque específico si el loop falla
            // Borra desde "const { mode } = useMode();" hasta antes de "const GalleryPage"
            const regex = /const { mode } = useMode\(\);[\s\S]*?(?=const GalleryPage)/g;
            if (content.match(regex)) {
                const newContent = content.replace(regex, ''); // Replace with empty string, effectively removing it
                fs.writeFileSync(appPath, newContent);
                console.log("✅ App.tsx: Código zombie eliminado (Plan B).");
            } else {
                console.log("❌ No se encontró el bloque corrupto. Verifica manualmente.");
            }
        }

    } else {
        console.log("🎉 PATRÓN NO DETECTADO: Parece que App.tsx ya está limpio (o el patrón es diferente).");
    }

} catch (e) {
    console.error("❌ ERROR:", e.message);
}

// 2. SUBIDA FINAL
console.log("\n🚀 SUBIENDO ARREGLO...");
try {
    execSync('git add src/App.tsx', { stdio: 'inherit' });
    execSync('git commit -m "fix(app): remove orphaned code block causing syntax error"', { stdio: 'inherit' });
    execSync('git push origin main --force', { stdio: 'inherit' });
    console.log("\n🏆 LISTO. El error de sintaxis 'Unexpected }' debería desaparecer.");
} catch (e) {
    console.error("GIT ERROR:", e.message);
}
