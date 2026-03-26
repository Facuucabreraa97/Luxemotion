import fs from 'fs';
import https from 'https';

// --- CONFIGURACIÓN OMEGA ---
const CONFIG = {
  targetFile: 'src/components/layout/MobileLayout.tsx', // O el archivo que quieras vigilar
  contextFile: 'CONTEXT.md',
  apiKey: process.env.GEMINI_API_KEY,
  timeout: 60000,
  maxRetries: 3
};

function cleanOutput(text) {
  return text.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '').trim();
}

// 1. CARGAR CONTEXTO DE NEGOCIO
function getBusinessContext() {
  if (fs.existsSync(CONFIG.contextFile)) {
    console.log('📘 [ANTIGRAVITY] Contexto de Negocio detectado y cargado.');
    return fs.readFileSync(CONFIG.contextFile, 'utf8');
  }
  return "No business context provided. Focus on code correctness only.";
}

// 2. DESCUBRIR MODELO
async function findBestModel() {
  console.log('📡 [ANTIGRAVITY] Iniciando enlace satelital...');
  return new Promise((resolve) => {
    const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models`);
    url.searchParams.append('key', CONFIG.apiKey);
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            const model = json.models?.find(m => m.name.includes('flash') && !m.name.includes('exp')) || 
                          json.models?.find(m => m.name.includes('gemini-pro'));
            resolve(model ? model.name : 'models/gemini-pro');
          } catch (e) { resolve('models/gemini-pro'); }
        } else { resolve('models/gemini-pro'); }
      });
    }).on('error', () => resolve('models/gemini-pro'));
  });
}

// 3. INFERENCIA CON CONTEXTO
async function askGemini(codeContent, contextContent, model) {
  return new Promise((resolve, reject) => {
    const modelId = model.startsWith('models/') ? model.split('/')[1] : model;
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${modelId}:generateContent?key=${CONFIG.apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeout: CONFIG.timeout
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode < 300) {
          try {
            const txt = JSON.parse(data).candidates?.[0]?.content?.parts?.[0]?.text;
            txt ? resolve(cleanOutput(txt)) : reject(new Error('VACIO'));
          } catch (e) { reject(e); }
        } else { reject(new Error(`API_${res.statusCode}`)); }
      });
    });
    
    // EL PROMPT MAESTRO CON CONTEXTO
    req.write(JSON.stringify({
      contents: [{ parts: [{ text: `ROLE: Senior Architect & Business Guardian.
CONTEXT:
${contextContent}

TASK: Rewrite the following file to be bug-free, production-ready, and ALIGNED WITH BUSINESS RULES.
RULES:
1. Return ONLY the full valid code.
2. If logic contradicts business context (e.g. unsecured endpoints), fix it immediately.
3. Fix all syntax errors.

INPUT CODE:
${codeContent}` }] }],
      generationConfig: { temperature: 0.1 }
    }));
    req.end();
  });
}

async function main() {
  if (!CONFIG.apiKey) process.exit(1);
  
  // Auto-healing si falta el archivo
  if (!fs.existsSync(CONFIG.targetFile)) {
    const dir = CONFIG.targetFile.substring(0, CONFIG.targetFile.lastIndexOf('/'));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG.targetFile, "// Recuperando archivo...");
  }
  
  try {
    const code = fs.readFileSync(CONFIG.targetFile, 'utf8');
    const context = getBusinessContext(); // <--- AQUÍ LEEMOS TU NEGOCIO
    const model = await findBestModel();
    
    console.log(`🧠 [ANTIGRAVITY] Analizando código con reglas de negocio...`);
    const newCode = await askGemini(code, context, model);
    
    if (newCode.length > 20) {
      fs.writeFileSync(CONFIG.targetFile, newCode);
      console.log('✅ [OMEGA] Código alineado con MivideoAI y reparado.');
    }
  } catch (e) {
    console.error('FALLO:', e.message);
    process.exit(1);
  }
}

main();
