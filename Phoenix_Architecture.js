import fs from 'fs';
import path from 'path';

console.log("\n🏗️ [PHOENIX] INICIANDO FASE 2: ARQUITECTURA MODULAR...\n");

const dirs = [
    'src/modules/auth',
    'src/modules/core',
    'src/modules/marketplace',
    'src/modules/studio',
    'src/components/ui', // Shared UI (Button, Input, etc) - though modules/core might handle this, standard UI often lives here or in core/ui. Let's stick to plan: core/ui is implicitly handled by modules/core or lib.
    // But for Shadcn/Radix often components/ui is used. Let's make src/modules/core/ui to be safe or just src/components/ui if we want global.
    // Plan said: modules/core (Layouts, UI Kit). So I will put UI kit in modules/core/ui.
    'src/modules/core/ui',
    'src/assets/branding' // Ensure branding dir exists just in case, though it is in public.
];

dirs.forEach(d => {
    if (!fs.existsSync(d)) {
        console.log(`📂 Creando: ${d}`);
        fs.mkdirSync(d, { recursive: true });
    }
});

console.log("✅ FASE 2 COMPLETADA: Estructura de directorios lista.");
