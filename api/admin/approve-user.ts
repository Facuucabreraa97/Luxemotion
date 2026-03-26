import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    // ── AUTH GATE ──────────────────────────────────────────────
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !String(authHeader).startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = String(authHeader).replace('Bearer ', '');

    const supabaseAdmin = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify caller identity
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Verify caller is admin
    const { data: callerProfile } = await supabaseAdmin
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!callerProfile?.is_admin) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // ── BUSINESS LOGIC ────────────────────────────────────────
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });

    try {
        // 1. Send Invite
        const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
        if (inviteError) throw inviteError;

        // 2. Update DB Status
        const { error: dbError } = await supabaseAdmin
            .from('profiles')
            .update({ status: 'APPROVED' })
            .eq('email', email);
        if (dbError) throw dbError;

        return res.status(200).json({ success: true, message: 'Invite sent & Profile Approved' });
    } catch (err: any) {
        console.error('[APPROVE-USER] Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
