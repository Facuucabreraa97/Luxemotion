import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Fallback to process.env if dotenv doesn't find them (e.g. system env)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Environment Variables: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function logTest() {
    console.log("Sentinel Omega: Initiating Uplink...");

    const { error } = await supabase.from('sentinel_logs').insert([
        {
            sentinel_name: 'SENTINEL OMEGA',
            action_type: 'SYSTEM_INIT',
            target_file: 'CORE_SYSTEMS',
            status: 'SUCCESS',
            report_text: 'Sentinel Protocols v1.0 Loaded. Dashboard Uplink Verified.'
        }
    ]);

    if (error) {
        console.error("Uplink Failed:", error);
    } else {
        console.log("Uplink Established. Log entry created.");
    }
}

logTest();
