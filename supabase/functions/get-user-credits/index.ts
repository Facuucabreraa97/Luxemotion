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
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        if (!supabaseUrl || !supabaseServiceKey) {
             throw new Error("Missing Environment Variables");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Verify Authentication
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        
        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Invalid Token" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
        }

        // 2. Fetch Credits
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single()

        if (profileError) {
             console.error("Profile Fetch Error", profileError);
             throw new Error("Failed to fetch profile");
        }

        return new Response(
            JSON.stringify({ credits: profile?.credits || 0 }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
