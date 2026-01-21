import fs from 'fs';
import https from 'https';

// --- CONFIGURATION --- 
const CONFIG = {
    targetFile: 'src/components/layout/MobileLayout.tsx',
    apiKey: process.env.GEMINI_API_KEY,
    timeout: 30000,
};

// --- STEP 1: AUTO-DISCOVER AVAILABLE MODELS --- 
async function findBestModel() {
    console.log('📡 [DISCOVERY] Asking Google for available models...');
    return new Promise((resolve, reject) => {
        const url = new URL('https://generativelanguage.googleapis.com/v1beta/models');
        url.searchParams.append('key', CONFIG.apiKey);

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        // Find first model that supports content generation
                        const viableModel = json.models?.find(m =>
                            m.supportedGenerationMethods?.includes('generateContent') &&
                            (m.name.includes('flash') || m.name.includes('pro'))
                        );

                        if (viableModel) {
                            console.log(`✨ [FOUND] Optimized Model Detected: ${viableModel.name}`);
                            // The API returns 'models/gemini-x', so we pass it directly
                            resolve(viableModel.name);
                        } else {
                            // Fallback if discovery returns weird list
                            console.warn('⚠️ [WARN] No ideal model found in list. Defaulting to gemini-pro.');
                            resolve('models/gemini-pro');
                        }
                    } catch (e) {
                        reject(new Error(`DISCOVERY JSON ERROR: ${e.message}`));
                    }
                } else {
                    console.warn(`⚠️ [WARN] Discovery failed (Status ${res.statusCode}). Defaulting fallback.`);
                    resolve('models/gemini-pro'); // Blind fallback
                }
            });
        }).on('error', (e) => {
            console.warn(`⚠️ [WARN] Discovery Network Error: ${e.message}`);
            resolve('models/gemini-pro');
        });
    });
}

// --- STEP 2: INFERENCE EXECUTION --- 
async function askGemini(prompt, modelName) {
    return new Promise((resolve, reject) => {
        // NOTE: modelName already contains 'models/' prefix from discovery 
        const cleanModel = modelName.startsWith('models/') ? modelName.split('/')[1] : modelName;
        const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`);
        url.searchParams.append('key', CONFIG.apiKey);

        const req = https.request({
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            timeout: CONFIG.timeout
        }, (res) => {
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
                        reject(new Error(`PARSE_ERROR: ${e.message}`));
                    }
                } else {
                    reject(new Error(`API_ERROR_${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', (e) => reject(new Error(`NETWORK: ${e.message}`)));

        // PAYLOAD 
        req.write(JSON.stringify({
            contents: [{
                parts: [{
                    text: `SYSTEM: Senior DevOps.\nTASK: Fix code. Output raw git diff.\n\nCODE:\n${prompt}`
                }]
            }],
            generationConfig: { temperature: 0.1 }
        }));
        req.end();

    });
}
// --- MAIN --- 
async function main() {
    console.log('🇬 [SENTINEL] AUTO-DISCOVERY PROTOCOL INITIATED...');

    if (!CONFIG.apiKey) {
        console.error('❌ [CRITICAL] GEMINI_API_KEY MISSING.');
        process.exit(1);
    }

    // 1. READ FILE 
    let sourceCode = '// TEST PAYLOAD';
    try {
        if (fs.existsSync(CONFIG.targetFile)) {
            sourceCode = fs.readFileSync(CONFIG.targetFile, 'utf8');
            console.log(`✅ [ACCESS] Target loaded: ${CONFIG.targetFile}`);
        }
    } catch (err) { /* Ignore */ }

    // 2. DISCOVER & EXECUTE 
    try {
        const bestModel = await findBestModel();
        console.log(`🧠 [THINKING] Inferencing via ${bestModel}...`);

        const patch = await askGemini(sourceCode, bestModel);
        if (!fs.existsSync('patches')) fs.mkdirSync('patches');
        fs.writeFileSync('patches/fix-ai.diff', patch);

        console.log('✅ [SUCCESS] Patch generated via Auto-Discovery.');

    } catch (error) {
        console.error(`💀 [FATAL] OPERATION FAILED: ${error.message}`);
        process.exit(1);
    }
}
main();
