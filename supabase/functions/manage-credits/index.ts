// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // 1. Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2. Create Supabase Admin Client (Bypasses RLS)
        // process.env is not available in Deno, use Deno.env.get
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 3. Parse Body
        const { targetUserId, amount, type, metadata } = await req.json()

        if (!targetUserId || amount === undefined) {
            throw new Error("Missing required fields: targetUserId, amount")
        }

        // 4. Verification Check (STRICT ADMIN CHECK)
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error("Missing Authorization header")

        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
        if (userError || !user) throw new Error("Invalid Token")

        const { data: callerProfile, error: callerError } = await supabaseAdmin
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()

        if (callerError || !callerProfile) throw new Error("Caller profile not found")
        
        if (!callerProfile.is_admin) {
            return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 });
        }

        // 5. Get Current Profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('credits')
            .eq('id', targetUserId)
            .single()

        if (profileError) throw new Error("User not found: " + profileError.message)

        const currentCredits = profile.credits || 0
        const newBalance = currentCredits + amount

        // Prevent negative balance (unless allowed by system type)
        if (newBalance < 0 && type !== 'ADJUSTMENT_PENALTY') {
            throw new Error("Insufficient funds for this transaction")
        }

        // 6. Atomic Update
        // We update ONLY the credits column.
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ credits: newBalance })
            .eq('id', targetUserId)

        if (updateError) throw updateError

        // 7. Log Transaction
        await supabaseAdmin
            .from('transactions')
            .insert([{
                user_id: targetUserId,
                type: type || 'SYSTEM',
                amount: amount,
                metadata: metadata || { source: 'edge_function_manage_credits' }
            }])

        return new Response(
            JSON.stringify({ success: true, newBalance, previousBalance: currentCredits }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
