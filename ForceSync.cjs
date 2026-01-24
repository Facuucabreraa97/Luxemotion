const { execSync } = require('child_process');

console.log("\n🔗 [PROTOCOL: BRANCH FUSION] INITIATING SYNC...\n");

try {
    // 1. Nos aseguramos de tener la última versión de todo
    console.log("⬇️ Fetching updates...");
    execSync('git fetch --all', { stdio: 'ignore' });

    // 2. Nos movemos a la rama que tiene el código NUEVO (production)
    console.log("👉 Switching to PRODUCTION branch (The New Code)...");
    try {
        execSync('git checkout production', { stdio: 'inherit' });
    } catch (e) {
        // Si falla, intentamos crearla o asumir que estamos en ella
        console.log("⚠️ Could not checkout production directly. Trying from current state...");
    }

    // 3. EL GOLPE MAESTRO: Empujar lo que tenemos AQUÍ hacia MAIN remoto
    console.log("🚀 OVERWRITING 'MAIN' WITH NEW CODE...");
    // Esto significa: "Toma mi código actual (HEAD) y fuérzalo en origin/main"
    execSync('git push origin HEAD:main --force', { stdio: 'inherit' });

    console.log("\n✅ SYNC COMPLETE.");
    console.log("🔥 VERCEL/RENDER SHOULD NOW DETECT A CHANGE ON 'MAIN'.");
    console.log("⏳ Wait 2 minutes and refresh your website.");

} catch (e) {
    console.error("💥 SYNC ERROR:", e.message);
    console.log("\n💡 INTENTO MANUAL: Escribe esto en la terminal:");
    console.log("git push origin HEAD:main --force");
}
