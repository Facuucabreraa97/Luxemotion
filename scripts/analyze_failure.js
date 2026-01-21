import fs from 'fs';
import https from 'https';

// --- CONFIGURATION (GOOGLE BRAIN) --- 
const CONFIG = {
    targetFile: 'src/components/layout/MobileLayout.tsx',
    apiKey: process.env.GEMINI_API_KEY, // Reading the new Google Key 
    model: 'gemini-1.5-flash', // Fast, Efficient, Free Tier eligible 
    timeout: 30000,
    maxRetries: 3
};

// --- UTILITY: GOOGLE GEMINI API CLIENT (ZERO DEP) --- 
async function askGemini(prompt, attempt = 1) {
    return new Promise((resolve, reject) => {
        const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.model}:generateContent`);
        url.searchParams.append('key', CONFIG.apiKey);

        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
                        // Gemini Response Structure Parsing
                        const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (content) {
                            resolve(content);
                        } else {
                            reject(new Error('GEMINI EMPTY RESPONSE'));
                        }
                    } catch (e) {
                        reject(new Error(`JSON PARSE FAIL: ${e.message}`));
                    }
                } else {
                    reject(new Error(`API STATUS ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (e) => reject(new Error(`NETWORK: ${e.message}`)));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('TIMEOUT'));
        });

        // Gemini Payload Structure
        const payload = {
            contents: [{
                parts: [{
                    text: `ROLE: You are a Senior React Engineer.\nTASK: Fix the code below. Output ONLY the raw git diff patch.\n\nCODE:\n${prompt}`
                }]
            }]
        };
        req.write(JSON.stringify(payload));
        req.end();

    }).catch(async (err) => {
        if (attempt < CONFIG.maxRetries) {
            console.warn(`⚠️ [RETRY] Gemini Attempt ${attempt} failed. Retrying in 2s... (${err.message})`);
            await new Promise(r => setTimeout(r, 2000));
            return askGemini(prompt, attempt + 1);
        } else {
            throw err;
        }
    });
}

// --- MAIN EXECUTION --- 
async function main() {
    console.log('🇬 [SENTINEL] GOOGLE PROTOCOL INITIATED...');

    if (!CONFIG.apiKey) {
        console.error('❌ [CRITICAL] GEMINI_API_KEY MISSING in GitHub Secrets.');
        process.exit(1);
    }

    let sourceCode = '';
    try {
        if (fs.existsSync(CONFIG.targetFile)) {
            sourceCode = fs.readFileSync(CONFIG.targetFile, 'utf8');
            console.log(`✅ [ACCESS] Read target file: ${CONFIG.targetFile}`);
        } else {
            console.warn(`⚠️ [WARNING] Target file not found. Simulating test.`);
            sourceCode = "// MOCK CODE FOR GEMINI TEST";
        }
    } catch (err) {
        console.error(`❌ [IO ERROR] ${err.message}`);
        process.exit(1);
    }

    console.log(`🧠 [THINKING] Contacting Google Gemini (${CONFIG.model})...`);
    try {
        const patch = await askGemini(sourceCode);

        if (!fs.existsSync('patches')) fs.mkdirSync('patches');
        fs.writeFileSync('patches/fix-ai.diff', patch);

        console.log('✅ [SUCCESS] Google Gemini generated a fix patch.');
        console.log('💉 [READY] Sentinel is armed with Google Intelligence.');

    } catch (error) {
        console.error(`💀 [FATAL] GEMINI FAILED: ${error.message}`);
        process.exit(1);
    }
}

main();
