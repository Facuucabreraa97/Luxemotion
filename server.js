
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// --- ECONOMIC ENGINE (85/10/5) ---
app.post('/api/market/buy', async (req, res) => {
    const { price } = req.body;
    const fee = price * 0.05;
    const royalty = price * 0.10;
    const seller = price * 0.85;
    console.log(`[TX] Split: Seller ${seller} | Royalty ${royalty} | Fee ${fee}`);
    res.json({ success: true, message: "Ownership Transferred (Wrapper Protocol)" });
});

app.post('/api/studio/generate', async (req, res) => {
    res.json({ outputUrl: "https://placehold.co/600x400/1a1a1a/D4AF37?text=HQ+Wrapper+Asset" });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(port, () => console.log('mivideoAI Core running on port ' + port));
