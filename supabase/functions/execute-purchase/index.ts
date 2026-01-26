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

        const { assetId, buyerId } = await req.json()

        if (!assetId || !buyerId) {
            throw new Error("Missing assetId or buyerId")
        }

        // 1. Get Asset & Owner
        const { data: asset, error: assetError } = await supabaseAdmin
            .from('talents')
            .select('*')
            .eq('id', assetId)
            .single()

        if (assetError || !asset) throw new Error("Asset not found")
        if (!asset.for_sale) throw new Error("Asset is not for sale")
        if (asset.owner_id === buyerId) throw new Error("Cannot buy your own asset")

        const price = asset.price || 0
        const royaltyFee = Math.floor(price * 0.10) // 10% Royalty
        const platformFee = Math.floor(price * 0.05) // 5% Platform
        const sellerRevenue = price - royaltyFee - platformFee

        // 2. Check Buyer Balance
        const { data: buyer, error: buyerError } = await supabaseAdmin
            .from('profiles')
            .select('credits')
            .eq('id', buyerId)
            .single()

        if (buyerError || !buyer) throw new Error("Buyer profile not found")
        if ((buyer.credits || 0) < price) throw new Error("Insufficient funds")

        // 3. Execution (We use direct updates since we are Admin)

        // A. Deduct from Buyer
        await updateCredits(supabaseAdmin, buyerId, -price)
        await logTx(supabaseAdmin, buyerId, 'BUY', -price, { asset_id: assetId, to: asset.owner_id })

        // B. Pay Seller
        await updateCredits(supabaseAdmin, asset.owner_id, sellerRevenue)
        await logTx(supabaseAdmin, asset.owner_id, 'DEPOSIT', sellerRevenue, { asset_id: assetId, from: buyerId, type: 'SALE' })

        // C. Pay Royalty (if Creator exists and is not Seller)
        if (asset.creator_id && asset.creator_id !== asset.owner_id) {
            await updateCredits(supabaseAdmin, asset.creator_id, royaltyFee)
            await logTx(supabaseAdmin, asset.creator_id, 'DEPOSIT', royaltyFee, { asset_id: assetId, from: buyerId, type: 'ROYALTY' })
        }

        // D. Transfer Asset
        const { error: transferError } = await supabaseAdmin
            .from('talents')
            .update({
                owner_id: buyerId,
                for_sale: false,
                price: 0,
                supply_sold: (asset.supply_sold || 0) + 1
            })
            .eq('id', assetId)

        if (transferError) throw new Error("Transfer failed: " + transferError.message)

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})

// Helpers
async function updateCredits(client: any, userId: string, amount: number) {
    const { data } = await client.from('profiles').select('credits').eq('id', userId).single()
    const newBal = (data?.credits || 0) + amount
    await client.from('profiles').update({ credits: newBal }).eq('id', userId)
}

async function logTx(client: any, userId: string, type: string, amount: number, meta: any) {
    await client.from('transactions').insert([{
        user_id: userId,
        type,
        amount,
        metadata: meta
    }])
}
