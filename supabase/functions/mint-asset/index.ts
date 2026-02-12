// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MINT_FEE = 50

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { assetData, userId } = await req.json()

        if (!assetData || !userId) {
            throw new Error("Missing assetData or userId")
        }

        // 1. Identity Verification
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error("Missing Authorization header")

        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
        if (authError || !authUser) throw new Error("Invalid Token")

        if (authUser.id !== userId) throw new Error("Unauthorized: Cannot mint for another user")

        // 2. Check Balance
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single()

        if (profileError || !profile) throw new Error("User not found")
        if ((profile.credits || 0) < MINT_FEE) throw new Error(`Insufficient funds. Minting costs ${MINT_FEE} credits.`)

        // 3. Deduct Fee
        const newBalance = profile.credits - MINT_FEE
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ credits: newBalance })
            .eq('id', userId)

        if (updateError) throw updateError

        // 4. Log Fee
        await supabaseAdmin.from('transactions').insert([{
            user_id: userId,
            type: 'MINT',
            amount: -MINT_FEE,
            metadata: { action: 'Asset Creation', asset_name: assetData.name }
        }])

        // 5. Create Asset
        const { data: asset, error: createError } = await supabaseAdmin
            .from('talents')
            .insert([{
                ...assetData,
                creator_id: userId,
                owner_id: userId,
                user_id: userId,
                for_sale: false,
                supply_sold: 0
            }])
            .select()
            .single()

        if (createError) throw createError

        return new Response(
            JSON.stringify({ success: true, asset }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
