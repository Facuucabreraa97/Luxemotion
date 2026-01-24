import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Security Gate
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });

    try {
        const supabaseAdmin = createClient(
            process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Send Invite Logic
        const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
        if (inviteError) throw inviteError;

        // 2. Update DB Status Logic
        const { error: dbError } = await supabaseAdmin
            .from('profiles')
            .update({ status: 'APPROVED' })
            .eq('email', email);
        if (dbError) throw dbError;

        return res.status(200).json({ success: true, message: 'Invite sent & Profile Approved' });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}
