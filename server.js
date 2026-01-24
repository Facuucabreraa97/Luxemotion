import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// MIDDLEWARE
const requireAdmin = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
    req.user = user;
    next();
};

// ADMIN ROUTES
app.post('/api/admin/approve-user', requireAdmin, async (req, res) => {
    const { email } = req.body;
    try {
        await supabaseAdmin.auth.admin.inviteUserByEmail(email);
        await supabaseAdmin.from('profiles').update({ status: 'APPROVED' }).eq('email', email);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/delete-user', requireAdmin, async (req, res) => {
    const { userId } = req.body;
    try {
        await supabaseAdmin.from('talents').delete().eq('user_id', userId);
        await supabaseAdmin.from('generation_jobs').delete().eq('user_id', userId);
        await supabaseAdmin.from('transactions').delete().eq('user_id', userId);
        await supabaseAdmin.from('generations').delete().eq('user_id', userId);
        await supabaseAdmin.from('profiles').delete().eq('id', userId);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/studio/generate', async (req, res) => {
    res.json({ outputUrl: "https://placehold.co/600x400/1a1a1a/D4AF37?text=Asset+Generated" });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(port, () => console.log(`Server running on ${port}`));
