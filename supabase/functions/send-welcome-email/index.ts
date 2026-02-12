// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://mivideoai.com'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'onboarding@resend.dev'

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Verify caller is admin
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error("Missing Authorization header")

        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
            authHeader.replace('Bearer ', '')
        )
        if (userError || !user) throw new Error("Invalid Token")

        // Check admin status
        const { data: callerProfile } = await supabaseAdmin
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()

        if (!callerProfile?.is_admin) throw new Error("Access Denied: Admin only")

        const { email } = await req.json()
        if (!email) throw new Error("Missing email")

        if (!RESEND_API_KEY) {
            console.warn('[SEND-WELCOME-EMAIL] No RESEND_API_KEY set, skipping email')
            return new Response(
                JSON.stringify({ success: true, warning: 'No RESEND_API_KEY configured, email not sent' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // Send via Resend API
        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: SENDER_EMAIL,
                to: [email],
                subject: "You're in! Welcome to MivideoAI Studio 🎬",
                html: `
                    <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; border-radius: 16px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #10b981, #06b6d4); padding: 40px 32px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                                Welcome to MivideoAI 🎬
                            </h1>
                            <p style="margin: 12px 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">
                                Your account has been approved
                            </p>
                        </div>
                        <div style="padding: 32px;">
                            <p style="color: #d1d5db; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                                Great news! Your application to MivideoAI has been reviewed and approved.
                                You now have full access to the AI Video Studio.
                            </p>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${FRONTEND_URL}/login"
                                   style="display: inline-block; background: linear-gradient(135deg, #10b981, #06b6d4); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 16px;">
                                    Enter the Studio →
                                </a>
                            </div>
                            <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
                                Start creating cinematic AI videos with our Draft and Master generation tiers.
                                Your initial credits are ready to use.
                            </p>
                        </div>
                        <div style="padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                            <p style="color: #4b5563; font-size: 11px; margin: 0;">
                                © ${new Date().getFullYear()} MivideoAI — AI Video Studio
                            </p>
                        </div>
                    </div>
                `,
            }),
        })

        if (!emailResponse.ok) {
            const errorData = await emailResponse.text()
            console.error('[SEND-WELCOME-EMAIL] Resend error:', errorData)
            throw new Error(`Resend API error: ${emailResponse.status}`)
        }

        const result = await emailResponse.json()
        console.log(`[SEND-WELCOME-EMAIL] Email sent to ${email}, id: ${result.id}`)

        return new Response(
            JSON.stringify({ success: true, emailId: result.id }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('[SEND-WELCOME-EMAIL] Error:', error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
