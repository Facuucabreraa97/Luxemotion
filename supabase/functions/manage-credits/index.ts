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

        // 5. Atomic Credit Update — use admin_adjust_credits RPC
        const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('admin_adjust_credits', {
            p_user_id: targetUserId,
            p_delta: amount
        })

        if (rpcError) {
            // Fallback: direct atomic SQL update if RPC doesn't exist yet
            console.warn('[MANAGE-CREDITS] RPC fallback, using direct update:', rpcError.message)

            // Prevent negative balance (unless penalty)
            const condition = amount < 0 && type !== 'ADJUSTMENT_PENALTY'
                ? { credits: `credits + ${amount}`, min: -amount }
                : { credits: `credits + ${amount}`, min: 0 }

            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ credits: supabaseAdmin.raw(`GREATEST(credits + ${amount}, 0)`) })
                .eq('id', targetUserId)

            if (updateError) throw updateError
        }

        // 6. Log Transaction
        await supabaseAdmin
            .from('transactions')
            .insert([{
                user_id: targetUserId,
                type: type || 'SYSTEM',
                amount: amount,
                metadata: metadata || { source: 'edge_function_manage_credits' }
            }])

        // 7. Get updated balance for response
        const { data: updatedProfile } = await supabaseAdmin
            .from('profiles')
            .select('credits')
            .eq('id', targetUserId)
            .single()

        return new Response(
            JSON.stringify({ success: true, newBalance: updatedProfile?.credits || 0 }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
