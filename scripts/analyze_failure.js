import fs from 'fs';
import https from 'https';

// --- CONFIGURATION (OMNI-CORE) --- 
const CONFIG = {
    targetFile: 'src/components/layout/MobileLayout.tsx',
    apiKey: process.env.GEMINI_API_KEY,
    // CASCADE STRATEGY: Try best model first, fallback to stable if 404/Error 
    modelCascade: ['gemini-1.5-flash', 'gemini-1.5-flash-001', 'gemini-pro'],
    timeout: 30000,
};

// --- UTILITY: ADAPTIVE GEMINI CLIENT --- 
async function askGemini(prompt, modelIndex = 0) {
    const currentModel = CONFIG.modelCascade[modelIndex];

    // Fail-safe check 
    if (!currentModel) throw new Error('ALL MODELS FAILED. SYSTEM EXHAUSTED.');

    console.log(`📡 [CONNECT] Attempting handshake with Model: ${currentModel}...`);

    return new Promise((resolve, reject) => {
        const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent`);
        url.searchParams.append('key', CONFIG.apiKey);

        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            timeout: CONFIG.timeout
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const json = JSON.parse(data);
                        const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (content) resolve(content);
                        else reject(new Error('EMPTY_RESPONSE'));
                    } catch (e) {
                        reject(new Error(`JSON_PARSE_ERROR: ${e.message}`));
                    }
                } else {
                    // Smart Reject with Status for Cascade Logic
                    reject(new Error(`API_ERROR_${res.statusCode}`));
                }
            });
        });
        req.on('error', (e) => reject(new Error(`NETWORK_ERROR: ${e.message}`)));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('TIMEOUT'));
        });

        // --- ADVANCED PROMPT ENGINEERING (Chain of Thought) ---
        const payload = {
            contents: [{
                parts: [{
                    text: `SYSTEM: You are a Senior React Architect.

STRATEGY: 1. Analyze the code. 2. Fix the overlap/layout issue. 3. Output valid git diff. OUTPUT FORMAT: ONLY raw git patch. No markdown.

CODE TO FIX: ${prompt}`
                }]
            }],
            generationConfig: {
                temperature: 0.1, // Surgical Precision 
                maxOutputTokens: 4000
            }
        };

        req.write(JSON.stringify(payload));
        req.end();

    }).catch(async (err) => {
        console.warn(`⚠️ [WARNING] Model ${currentModel} failed: ${err.message}`);

        // RECURSIVE CASCADE: Try next model
        if (modelIndex < CONFIG.modelCascade.length - 1) {
            console.log(`🔄 [SWITCH] Rerouting to fallback model...`);
            return askGemini(prompt, modelIndex + 1);
        } else {
            throw new Error(`FATAL: All AI models unresponsive. Last error: ${err.message}`);
        }
    });
}

// --- MAIN EXECUTION --- 
async function main() {
    console.log('🇬 [SENTINEL] OMNI-CORE PROTOCOL INITIATED...');

    if (!CONFIG.apiKey) {
        console.error('❌ [CRITICAL] GEMINI_API_KEY MISSING.');
        process.exit(1);
    }

    let sourceCode = '';
    try {
        if (fs.existsSync(CONFIG.targetFile)) {
            sourceCode = fs.readFileSync(CONFIG.targetFile, 'utf8');
            console.log(`✅ [ACCESS] Read target file: ${CONFIG.targetFile}`);
        } else {
            console.warn(`⚠️ [WARNING] Target file not found. Simulating test.`);
            sourceCode = "// TEST PAYLOAD: console.log('Antigravity Test');";
        }
    } catch (err) {
        console.error(`❌ [IO ERROR] ${err.message}`);
        process.exit(1);
    }

    console.log('🧠 [THINKING] Engaging Adaptive Intelligence...');
    try {
        const patch = await askGemini(sourceCode);

        if (!fs.existsSync('patches')) fs.mkdirSync('patches');
        fs.writeFileSync('patches/fix-ai.diff', patch);

        console.log('✅ [SUCCESS] Patch generated successfully via Cascade Protocol.');

    } catch (error) {
        console.error(`💀 [FATAL] MISSION FAILED: ${error.message}`);
        process.exit(1);
    }
}

main();
