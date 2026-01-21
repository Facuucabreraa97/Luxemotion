import fs from 'fs';
import https from 'https';
import path from 'path';

// --- CONFIGURATION (THE BRAIN) --- 
const CONFIG = {
    targetFile: 'src/components/layout/MobileLayout.tsx', // In production, pass this via process.argv 
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4', // Using the smartest model for code repair 
    timeout: 30000 // 30s Hard Timeout to prevent CI hanging 
};

// --- UTILITY: PROMISIFIED HTTPS (ZERO DEPENDENCY FETCH) --- 
function askOracle(prompt) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.apiKey}`
            },
            timeout: CONFIG.timeout
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const json = JSON.parse(data);
                        resolve(json.choices[0].message.content);
                    } catch (e) {
                        reject(new Error(`FAILED TO PARSE JSON: ${e.message}`));
                    }
                } else {
                    reject(new Error(`API ERROR: Status ${res.statusCode} - ${data}`));
                }
            });
        });

        req.on('error', (e) => reject(new Error(`NETWORK FAILURE: ${e.message}`)));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('REQUEST TIMED OUT'));
        });

        req.write(JSON.stringify({
            model: CONFIG.model,
            messages: [
                { role: "system", content: "You are a Senior React Engineer. Output ONLY the raw git diff patch." },
                { role: "user", content: prompt }
            ]
        }));
        req.end();
    });
}

// --- MAIN EXECUTION (ASYNC FLOW) --- 
async function main() {
    console.log('🧬 [SENTINEL] SURGEON PROTOCOL INITIATED...');

    // 1. SECURITY CHECK 
    if (!CONFIG.apiKey) {
        console.error('❌ [CRITICAL] OPENAI_API_KEY MISSING. ABORTING.');
        process.exit(1);
    }

    // 2. READ SOURCE 
    let sourceCode = '';
    try {
        if (fs.existsSync(CONFIG.targetFile)) {
            sourceCode = fs.readFileSync(CONFIG.targetFile, 'utf8');
            console.log(`✅ [ACCESS] Read target file: ${CONFIG.targetFile}`);
        } else {
            console.warn(`⚠️ [WARNING] Target file not found. Simulating for connectivity test.`);
            sourceCode = "// MOCK CONTENT FOR CONNECTION TEST";
        }
    } catch (err) {
        console.error(`❌ [IO ERROR] Could not read file: ${err.message}`);
        process.exit(1);
    }

    // 3. GENERATE DIAGNOSIS 
    console.log('🧠 [THINKING] Consultando a la Inteligencia Artificial...');
    try {
        const patch = await askOracle(`Fix the following code (overlap issue):\n\n${sourceCode}`);

        // 4. SAVE ARTIFACT
        if (!fs.existsSync('patches')) fs.mkdirSync('patches');
        fs.writeFileSync('patches/fix-ai.diff', patch);

        console.log('✅ [SUCCESS] Patch generated and saved to patches/fix-ai.diff');
        console.log('💉 [READY] Sentinel is ready for injection.');
    } catch (error) {
        console.error(`💀 [FATAL] AI PROCESSING FAILED: ${error.message}`);
        process.exit(1);
    }
}

// EXECUTE 
main();
