import fs from 'fs';
import https from 'https';

// --- CONFIGURATION --- 
const CONFIG = {
    targetFile: 'src/components/layout/MobileLayout.tsx',
    apiKey: process.env.GEMINI_API_KEY,
    timeout: 60000,
    maxRetries: 3
};

function cleanOutput(text) {
    return text.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '').trim();
}

// --- STEP 1: AUTO-DISCOVER --- 
async function findBestModel() {
    console.log('📡 [DISCOVERY] Pinging Google Cloud...');
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
                        const viableModel = json.models?.find(m =>
                            m.supportedGenerationMethods?.includes('generateContent') &&
                            m.name.includes('flash') && !m.name.includes('exp')
                        ) || json.models?.find(m => m.name.includes('gemini-pro'));
                        resolve(viableModel ? viableModel.name : 'models/gemini-pro');
                    } catch (e) { resolve('models/gemini-pro'); }
                } else { resolve('models/gemini-pro'); }
            });
        }).on('error', () => resolve('models/gemini-pro'));
    });
}

async function askGemini(fileContent, model) {
    return new Promise((resolve, reject) => {
        const cleanModel = model.startsWith('models/') ? model.split('/')[1] : model;
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
                    } catch (e) { reject(new Error(`PARSE_ERROR: ${e.message}`)); }
                } else { reject(new Error(`API_ERROR_${res.statusCode}: ${data}`)); }
            });
        });

        req.on('error', (e) => reject(new Error(`NETWORK: ${e.message}`)));

        // ATOMIC REWRITE PROMPT
        req.write(JSON.stringify({
            contents: [{
                parts: [{
                    text: `SYSTEM: Senior React Architect.
TASK: Analyze the following file content. Fix any bugs, layout issues, or syntax errors.
OUTPUT RULE: Return the FULL, SELF-CONTAINED CODE for the entire file. DO NOT return a diff. DO NOT return markdown fences if possible (or I will strip them).
CODE:
${fileContent}`
                }]
            }],
            generationConfig: { temperature: 0.1 }
        }));
        req.end();
    });
}

async function main() {
    console.log('🇬 [SENTINEL] OMEGA PROTOCOL INITIATED...');

    // Safety: Auto-Create if missing
    if (!fs.existsSync(CONFIG.targetFile)) {
        console.warn('⚠️ Target file missing. Creating Stabilizer Skeleton.');
        if (!fs.existsSync('src/components/layout')) fs.mkdirSync('src/components/layout', { recursive: true });
        fs.writeFileSync(CONFIG.targetFile, "export default function MobileLayout() { return <div>Sentinel Active</div> }");
    }

    const source = fs.readFileSync(CONFIG.targetFile, 'utf8');
    const bestModel = await findBestModel();
    console.log(`🧠 [THINKING] Rewrite via ${bestModel}...`);

    try {
        const rawCode = await askGemini(source, bestModel);
        const cleanCode = cleanOutput(rawCode);

        // Safety: Check for hallucination (Too short)
        if (cleanCode.length < 50) {
            throw new Error('AI Output too short. Preventing Destructive Write.');
        }

        // ATOMIC WRITE
        fs.writeFileSync(CONFIG.targetFile, cleanCode);
        console.log('✅ ATOMIC REWRITE COMPLETE.');

    } catch (err) {
        console.error(`💀 [FATAL] ${err.message}`);
        process.exit(1);
    }
}
main();
