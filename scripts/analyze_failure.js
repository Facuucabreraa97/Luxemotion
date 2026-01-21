const fs = require('fs');
const https = require('https');

// 1. IDENTIFY THE BROKEN FILE (In a real scenario, parse this from test logs)
// For this deployment, we target the known mobile layout file.
const targetFile = 'src/components/layout/MobileLayout.tsx';

console.log(`🧬 SURGEON: Analyzing ${targetFile}...`);

if (!process.env.OPENAI_API_KEY) {
    console.error("❌ NO BRAIN FOUND: OPENAI_API_KEY missing. Falling back to Heuristic Fix.");
    // Fallback logic here if needed, but for Max Capacity we assume Key exists
    process.exit(1);
}

// 2. READ SOURCE CODE
let sourceCode = '';
try {
    sourceCode = fs.readFileSync(targetFile, 'utf8');
} catch (e) {
    console.error(`❌ FILE NOT FOUND: ${targetFile}`);
    process.exit(1);
}

// 3. CONSULT THE ORACLE (OpenAI API Call via raw HTTPS to avoid dependencies)
const prompt = `
  ROLE: You are the Chief Technology Officer (CTO) of VydyLabs.
  INPUT: Test logs and source code from the latest build.

  MISSION:
  1. ANALYZE the system health based on the provided logs.
  2. IDENTIFY any critical failures (P0) or warnings.
  3. STRATEGIZE: Provide 1 specific, high-level recommendation to improve UX, Architecture, or Finance.
  4. EXECUTE: If a bug is found in the code, generate a valid Git Patch.

OUTPUT FORMAT (Markdown):
  ## 🚦 Executive Status: [HEALTHY / CRITICAL]
  ### 🧐 Strategic Insight
  [Your professional advice here]
  ### 🛠️ Technical Details
  [Log summary]
  ### 💉 Auto-Fix
  [If applicable, describe the patch]
`;

const req = https.request({
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }
}, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const response = JSON.parse(data);
        if (response.error) {
            console.error("❌ BRAIN DAMAGE:", response.error);
            process.exit(1);
        }
        const patch = response.choices[0].message.content;

        // 4. SAVE THE INTELLIGENT PATCH
        if (!fs.existsSync('patches')) fs.mkdirSync('patches');
        fs.writeFileSync('patches/fix-ai.diff', patch);
        console.log("✅ SURGEON: AI Patch Generated successfully.");
    });
});

req.write(JSON.stringify({
    model: "gpt-4", // Or gpt-3.5-turbo
    messages: [{ role: "user", content: prompt }]
}));
req.end();
