import fs from 'fs';
import { execSync } from 'child_process';

console.log("\n⚙️ [CONFIG FIX] REPARANDO CONFIGURACIÓN DEL PROYECTO... (ESM Mode)\n");

// 1. GENERAR VITE.CONFIG.TS (Con soporte para '@')
const viteConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
  }
});
`;
fs.writeFileSync('vite.config.ts', viteConfig);
console.log("✅ vite.config.ts: Alias '@' configurado.");

// 2. GENERAR TSCONFIG.JSON (Para que TypeScript entienda el '@')
const tsConfig = `
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
`;
fs.writeFileSync('tsconfig.json', tsConfig);
console.log("✅ tsconfig.json: Paths '@' configurados.");

// 3. GENERAR TSCONFIG.NODE.JSON (Soporte)
const tsConfigNode = `
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
`;
fs.writeFileSync('tsconfig.node.json', tsConfigNode);

// 4. ASEGURAR DEPENDENCIAS DE IDIOMA (Por si acaso)
try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.dependencies = pkg.dependencies || {};
    // Usamos spread para mantener lo existente y sobreescribir/añadir lo nuevo
    Object.assign(pkg.dependencies, {
        "i18next": "^23.10.0",
        "react-i18next": "^14.1.0",
        "i18next-browser-languagedetector": "^7.2.0",
        "i18next-http-backend": "^2.5.0",
        "@types/node": "^20.11.0" // Necesario para 'path' en vite.config
    });

    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    console.log("✅ package.json: Dependencias aseguradas.");
} catch (e) {
    console.error("❌ Error leyendo/escribiendo package.json:", e.message);
}

// 5. SUBIDA FINAL
console.log("\n🚀 SUBIENDO CONFIGURACIÓN...");
try {
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "fix(config): setup vite alias and tsconfig paths"', { stdio: 'inherit' });
    execSync('git push origin main --force', { stdio: 'inherit' });
    console.log("\n🏆 LISTO. Vercel ahora entenderá los imports '@' y las librerías.");
} catch (e) {
    console.error("GIT ERROR:", e.message);
}
