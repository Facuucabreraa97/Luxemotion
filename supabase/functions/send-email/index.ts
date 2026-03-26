// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://www.mivideoai.com'

const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://mivideoai.com'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'onboarding@resend.dev'

// HTML escape helper — prevents XSS in email templates
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

// ══════════════════════════════════════════════════════════════
// TEMPLATE REGISTRY — Add new email types here
// ══════════════════════════════════════════════════════════════
interface TemplateResult {
    subject: string
    html: string
}

const TEMPLATES: Record<string, (vars: Record<string, string>) => TemplateResult> = {

    welcome: (vars) => ({
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
                        <a href="${vars.loginUrl || FRONTEND_URL + '/login'}"
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

    payment_approved: (vars) => ({
        subject: `Payment Approved — ${escapeHtml(vars.amount || '')} CR Added 💰`,
        html: `
            <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 40px 32px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                        Payment Confirmed 💰
                    </h1>
                </div>
                <div style="padding: 32px;">
                    <p style="color: #d1d5db; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                        Your payment has been reviewed and approved.
                        <strong style="color: #10b981;">${escapeHtml(vars.amount || '—')} CR</strong> have been added to your account.
                    </p>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${vars.loginUrl || FRONTEND_URL + '/app'}"
                           style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 16px;">
                            Start Creating →
                        </a>
                    </div>
                </div>
                <div style="padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                    <p style="color: #4b5563; font-size: 11px; margin: 0;">
                        © ${new Date().getFullYear()} MivideoAI — AI Video Studio
                    </p>
                </div>
            </div>
        `,
    }),

    alert: (vars) => ({
        subject: escapeHtml(vars.subject || 'MivideoAI Notification'),
        html: `
            <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 32px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">
                        ${escapeHtml(vars.title || 'Notification')}
                    </h1>
                </div>
                <div style="padding: 32px;">
                    <p style="color: #d1d5db; font-size: 15px; line-height: 1.6; margin: 0;">
                        ${escapeHtml(vars.message || '')}
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
}

// ══════════════════════════════════════════════════════════════
// HANDLER
// ══════════════════════════════════════════════════════════════
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

        const { data: callerProfile } = await supabaseAdmin
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()

        if (!callerProfile?.is_admin) throw new Error("Access Denied: Admin only")

        // Parse request
        const { email, template = 'welcome', vars = {} } = await req.json()
        if (!email) throw new Error("Missing email")

        // Resolve template
        const templateFn = TEMPLATES[template]
        if (!templateFn) {
            throw new Error(`Unknown template: '${template}'. Available: ${Object.keys(TEMPLATES).join(', ')}`)
        }

        if (!RESEND_API_KEY) {
            console.warn(`[SEND-EMAIL] No RESEND_API_KEY set, skipping ${template} email to ${email}`)
            return new Response(
                JSON.stringify({ success: true, warning: 'No RESEND_API_KEY configured, email not sent' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        const { subject, html } = templateFn({ ...vars, loginUrl: vars.loginUrl || `${FRONTEND_URL}/login` })

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
                subject,
                html,
            }),
        })

        if (!emailResponse.ok) {
            const errorData = await emailResponse.text()
            console.error(`[SEND-EMAIL] Resend error (${template}):`, errorData)
            throw new Error(`Resend API error: ${emailResponse.status}`)
        }

        const result = await emailResponse.json()
        console.log(`[SEND-EMAIL] ${template} email sent to ${email}, id: ${result.id}`)

        return new Response(
            JSON.stringify({ success: true, emailId: result.id, template }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('[SEND-EMAIL] Error:', error.message)
        return new Response(
            JSON.stringify({ error: 'Email operation failed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
