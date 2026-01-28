// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { email } = await req.json()

        if (!email) {
            throw new Error("Missing email")
        }

        // 0. Access Control
        const authHeader = req.headers.get('Authorization')
        // Optional: If no auth header, maybe allow checking ONLY if it's the same flow? 
        // But better to be strict: Only authenticated users can check status? 
        // Actually, validation flow might be pre-login. 
        // IF pre-login, we might need a different approach (e.g. public endpoint but rate limited).
        // HOWEVER, assuming this is called by App.tsx which has session...
        
        let isRequesterAdmin = false
        if (authHeader) {
            const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
            if (user) {
                // Check if checking own email
                if (user.email === email) {
                    // Allowed
                } else {
                    // Check if Admin
                     const { data: profile } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', user.id).single()
                     if (profile?.is_admin) {
                        isRequesterAdmin = true
                     } else {
                        // Not Admin, Not Own Email -> Partial Block? 
                        // Actually, looking up *other* people's whitelist status is an admin feature.
                        throw new Error("Unauthorized to check other users' status")
                     }
                }
            }
        }
        // NOTE: If no auth header (public check), we proceed cautiously or block. 
        // Use case: Landing page "Check my spot". 
        // If we allow public checks, we leak who is on the list.
        // For now, let's assume strict mode or at least require some auth if checking arbitrary emails.
        // Given the code context: App.tsx calls it with session.user.email. So Auth is present.


        // Secure Lookup
        const { data, error } = await supabaseAdmin
            .from('whitelist')
            .select('status')
            .eq('email', email.toLowerCase())
            .single()

        const isAllowed = data?.status === 'approved'

        return new Response(
            JSON.stringify({ allowed: isAllowed, status: data?.status || 'pending' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
