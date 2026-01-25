import fs from 'fs';
import path from 'path';

console.log("\n🔥 [PHOENIX] INICIANDO FASE 1: LIMPIEZA INTELIGENTE...\n");

const toDelete = [
    'src/components',
    'src/pages',
    'src/App.tsx',
    'src/main.tsx',
    'src/index.css' // We will recreate this potentially or keep it? Plan says "Delete Old Src". Let's delete to be safe and recreate.
];

const preserve = [
    'src/lib',
    'src/types', // If exists
    'src/assets', // If exists and useful
    'public',
    'vite.config.ts',
    'tsconfig.json',
    'tailwind.config.js',
    '.env'
];

toDelete.forEach(p => {
    if (fs.existsSync(p)) {
        console.log(`🗑️ Eliminando: ${p}`);
        fs.rmSync(p, { recursive: true, force: true });
    } else {
        console.log(`⚠️ No encontrado (ya limpio): ${p}`);
    }
});

console.log("✅ FASE 1 COMPLETADA: Infraestructura preservada, código legado eliminado.");
console.log("👉 Listo para la Fase 2: Arquitectura Modular.");
