
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Lógica 85/10/5 (Prueba de vida de mivideoAI)
app.post('/api/market/buy', (req, res) => {
    const { price } = req.body;
    res.json({ success: true, split: { seller: price * 0.85, royalty: price * 0.10, fee: price * 0.05 } });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(port, () => console.log('mivideoAI Core running on ' + port));
