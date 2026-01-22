import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email required' });
    }

    // Verify Environment
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SERVICE_KEY) {
        return res.status(500).json({ error: 'Internal Server Error: Missing Service Key' });
    }

    try {
        const supabase = createClient(SUPABASE_URL!, SERVICE_KEY);

        // 1. Invite User (Send Email)
        const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);

        if (error) {
            console.error('Supabase Invite Error:', error);
            // If user already exists, just approve them in DB?
            // "User already registered" might be returned.
            // But usually we just update DB status.
        }

        // 2. Update Profile Status
        const { error: dbError } = await supabase
            .from('profiles')
            .update({ status: 'APPROVED', access_status: 'approved' }) // Update both for safety
            .eq('email', email);

        if (dbError) throw dbError;

        return res.status(200).json({ success: true, message: 'User approved' });

    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
