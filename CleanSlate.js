import fs from 'fs';
import path from 'path';

console.log("\n🧹 [CLEAN SLATE] INICIANDO PROTOCOLO DE BORRADO DE CÓDIGO VIEJO... (ESM Mode)\n");

// LISTA DE CARPETAS Y ARCHIVOS A ELIMINAR (Lo que ya no sirve)
const pathsToDelete = [
    'src/components',       // Componentes viejos/rotos
    'src/pages',            // Páginas viejas
    'src/hooks',            // Hooks posiblemente rotos
    'src/context',          // Contextos antiguos
    'src/locales',          // Traducciones viejas (si existen)
    'src/App.tsx',          // Router viejo
    'src/index.tsx',        // Entry point viejo (lo haremos de nuevo como main.tsx)
    'src/main.tsx',         // Si existe, se va
    'src/styles.ts',        // Estilos viejos
    'src/types.ts',         // Tipos viejos
    'src/vite-env.d.ts'     // Lo regeneraremos limpio
];

// ESTRUCTURA A PROTEGER (Lo que NO se toca)
// - src/lib/supabase.ts (Conexión DB)
// - public/ (Logos e imágenes)
// - supabase/ (Migraciones SQL)
// - *.config.ts|js (Configs del proyecto)

pathsToDelete.forEach(p => {
    const fullPath = path.resolve(p);
    if (fs.existsSync(fullPath)) {
        try {
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`❌ ELIMINADO: ${p}`);
        } catch (e) {
            console.error(`⚠️ Error borrando ${p}:`, e.message);
        }
    } else {
        // console.log(`💨 Ya estaba limpio: ${p}`); // Less noise
    }
});

console.log("\n✨ LIMPIEZA COMPLETADA.");
console.log("👉 La infraestructura (Vercel, Supabase, Tailwind) sigue intacta.");
console.log("👉 La carpeta 'public/' (Logos) sigue intacta.");
console.log("READY FOR NEW BUILD.");
