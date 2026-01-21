import fs from 'fs';
import https from 'https';

// --- CONFIGURATION --- 
const CONFIG = {
    targetFile: 'src/components/layout/MobileLayout.tsx',
    apiKey: process.env.GEMINI_API_KEY,
    timeout: 30000,
    maxRetries: 3 // Resurrected the Retry Shield 
};

// --- STEP 1: AUTO-DISCOVER AVAILABLE MODELS --- 
async function findBestModel() {
    console.log('📡 [DISCOVERY] Asking Google for available models...');
    return new Promise((resolve) => {
        const url = new URL('https://generativelanguage.googleapis.com/v1beta/models');
        url.searchParams.append('key', CONFIG.apiKey);

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        // STRATEGY: Find 'flash' models but avoid 'experimental' if possible for stability
                        const viableModel = json.models?.find(m =>
                            m.supportedGenerationMethods?.includes('generateContent') &&
                            m.name.includes('flash') && !m.name.includes('exp')
                        ) || json.models?.find(m => m.name.includes('gemini-pro'));

                        if (viableModel) {
                            console.log(`✨ [FOUND] Optimized Model: ${viableModel.name}`);
                            resolve(viableModel.name);
                        } else {
                            console.warn('⚠️ [WARN] No ideal model. Defaulting to gemini-pro.');
                            resolve('models/gemini-pro');
                        }
                    } catch (e) {
                        resolve('models/gemini-pro');
                    }
                } else {
                    resolve('models/gemini-pro');
                }
            });
        }).on('error', () => resolve('models/gemini-pro'));
    });
}

// --- STEP 2: INFERENCE WITH RETRY LOGIC --- 
async function askGemini(prompt, modelName, attempt = 1) {
    return new Promise((resolve, reject) => {
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
                    // Reject specifically to trigger the retry loop
                    reject(new Error(`API_ERROR_${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', (e) => reject(new Error(`NETWORK: ${e.message}`)));

        // PAYLOAD: Chain-of-Thought applied 
        req.write(JSON.stringify({
            contents: [{
                parts: [{
                    text: `SYSTEM: Senior DevOps.\nTASK: Fix code. Output raw git diff.\n\nCODE:\n${prompt}`
                }]
            }],
            generationConfig: { temperature: 0.1 }
        }));
        req.end();

    }).catch(async (err) => {
        // --- THE RESURRECTED SHIELD ---
        if (attempt < CONFIG.maxRetries) {
            console.warn(`⚠️ [RETRY] Attempt ${attempt} failed (${err.message}). Retrying in 3s...`);
            await new Promise(r => setTimeout(r, 3000)); // Wait 3s (Exponential backoff simulation)
            return askGemini(prompt, modelName, attempt + 1);
        } else {
            throw err;
        }
    });
}

// --- MAIN --- 
async function main() {
    console.log('🇬 [SENTINEL] HYBRID PROTOCOL INITIATED...');

    if (!CONFIG.apiKey) {
        console.error('❌ [CRITICAL] GEMINI_API_KEY MISSING.');
        process.exit(1);
    }

    let sourceCode = '// TEST PAYLOAD';
    try {
        if (fs.existsSync(CONFIG.targetFile)) {
            sourceCode = fs.readFileSync(CONFIG.targetFile, 'utf8');
            console.log(`✅ [ACCESS] Target loaded: ${CONFIG.targetFile}`);
        }
    } catch (err) { /* Ignore */ }

    try {
        // 1. DISCOVER 
        const bestModel = await findBestModel();
        console.log(`🧠 [THINKING] Inferencing via ${bestModel}...`);

        // 2. EXECUTE WITH SHIELD
        const patch = await askGemini(sourceCode, bestModel);
        if (!fs.existsSync('patches')) fs.mkdirSync('patches');
        fs.writeFileSync('patches/fix-ai.diff', patch);

        console.log('✅ [SUCCESS] Patch generated via Hybrid Protocol.');

    } catch (error) {
        console.error(`💀 [FATAL] OPERATION FAILED: ${error.message}`);
        process.exit(1);
    }
}
main();
