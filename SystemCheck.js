// ⚠️ GUARDA COMO 'SystemCheck.js' Y EJECUTA: node SystemCheck.js
// OBJETIVO: Leer el estado actual de Git y Archivos sin modificar nada.

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log("\n🔍 [SYSTEM DIAGNOSTIC] READING VITAL SIGNS...\n");

try {
    // 1. CHEQUEO DE RAMA ACTUAL
    console.log("👉 1. CURRENT BRANCH:");
    try {
        const branch = execSync('git branch --show-current').toString().trim();
        console.log(`   [${branch}]`);
    } catch (e) { console.log("   (Error reading branch)"); }

    // 2. CHEQUEO DE ESTADO (¿Hay cambios pendientes?)
    console.log("\n👉 2. GIT STATUS (Short):");
    try {
        const status = execSync('git status -s').toString().trim();
        console.log(status ? status : "   (Clean - No changes detected)");
    } catch (e) { console.log("   (Error reading status)"); }

    // 3. CHEQUEO DE REMOTOS (¿A dónde apunta origin?)
    console.log("\n👉 3. REMOTE URL:");
    try {
        const remote = execSync('git remote -v').toString().trim();
        console.log(remote);
    } catch (e) { console.log("   (Error reading remote)"); }

    // 4. LISTA DE RAMAS REMOTAS (¿Qué existe en GitHub?)
    console.log("\n👉 4. ALL BRANCHES (Local & Remote):");
    try {
        const branches = execSync('git branch -a').toString().trim();
        console.log(branches);
    } catch (e) { console.log("   (Error listing branches)"); }

    // 5. ULTIMO COMMIT (¿Qué versión tenemos?)
    console.log("\n👉 5. LAST COMMIT:");
    try {
        const log = execSync('git log -1 --format="%h - %s (%cd)"').toString().trim();
        console.log(log);
    } catch (e) { console.log("   (No commits found)"); }

    // 6. CHEQUEO FÍSICO DEL SENTINELA
    console.log("\n👉 6. SENTINEL FILE CHECK:");
    const sentinelPath = '.github/workflows/panopticon.yml';
    if (fs.existsSync(sentinelPath)) {
        console.log("   ⚠️ EXISTE (Alive): " + sentinelPath);
        console.log("   CONTENT PREVIEW: " + fs.readFileSync(sentinelPath, 'utf8').substring(0, 50).replace(/\n/g, ' '));
    } else {
        console.log("   ✅ NO EXISTE (Dead): File not found on disk.");
    }

    // 7. CHEQUEO DE PACKAGE.JSON
    console.log("\n👉 7. PACKAGE.JSON TYPE:");
    try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        console.log(`   type: ${pkg.type || "UNDEFINED (CommonJS)"}`);
    } catch (e) { console.log("   (Error reading package.json)"); }

} catch (e) {
    console.error("\n❌ FATAL ERROR IN DIAGNOSTIC:", e.message);
}
