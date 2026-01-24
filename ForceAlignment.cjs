const { execSync } = require('child_process');

console.log("\n🔗 [PROTOCOL: ALIGNMENT] SYNCING BRANCHES TO TRIGGER DEPLOY...\n");

try {
    // 1. Asegurarnos de que estamos en la rama con los cambios (production)
    console.log("👉 Checking out GENESIS code...");
    try {
        execSync('git checkout production', { stdio: 'ignore' });
    } catch (e) {
        // Si falla, quizás ya estamos ahí o se llama diferente, intentamos forzar el push desde HEAD
    }

    // 2. EL TRUCO DE MAGIA: Empujar la rama actual hacia 'main' remota
    // Esto le dice a GitHub: "Toma mi código actual y mételo a la fuerza en main"
    console.log("🚀 FORCING SYNC TO 'MAIN' BRANCH...");
    execSync('git push origin HEAD:main --force', { stdio: 'inherit' });

    // 3. También actualizamos production por si acaso
    console.log("🚀 UPDATING 'PRODUCTION' BRANCH...");
    execSync('git push origin HEAD:production --force', { stdio: 'inherit' });

    console.log("\n✅ ALIGNMENT COMPLETE.");
    console.log("👀 CHECK VERCEL/RENDER NOW. A NEW BUILD SHOULD START ON 'MAIN'.");

} catch (e) {
    console.error("💥 SYNC ERROR:", e.message);
    console.log("INTENTO MANUAL: Escribe en la terminal: git push origin HEAD:main --force");
}
