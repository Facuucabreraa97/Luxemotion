
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

app.post('/api/market/buy', (req, res) => {
    const { price } = req.body;
    res.json({ success: true, split: { seller: price * 0.85, royalty: price * 0.10, fee: price * 0.05 } });
});
app.post('/api/studio/generate', (req, res) => res.json({ outputUrl: "https://placehold.co/600x400/1a1a1a/D4AF37?text=Asset+Generated" }));

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(port, () => console.log('mivideoAI running on ' + port));
