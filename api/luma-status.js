// api/luma-status.js
// Poll Luma generation status and persist completed videos
import { createClient } from '@supabase/supabase-js';

export const config = {
    maxDuration: 30,
};
export const dynamic = 'force-dynamic';

const LUMA_API_BASE = 'https://api.lumalabs.ai/dream-machine/v1';

/**
 * Helper: Upload video to Supabase Storage
 */
async function uploadToSupabase(url, filePath, supabase) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download: ${url}`);
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'video/mp4';

    const { error } = await supabase.storage
        .from('videos')
        .upload(filePath, buffer, { contentType, upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

    return publicUrl;
}

import { rateLimit, verifyAuth } from './lib/rateLimit.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate limit: 20 requests per minute (polling endpoint)
    if (rateLimit(req, res, { maxRequests: 20, windowMs: 60000 })) return;

    const LUMA_API_KEY = process.env.LUMA_API_KEY;
    if (!LUMA_API_KEY) {
        return res.status(500).json({ error: 'LUMA_API_KEY not configured' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Missing environment variables' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // JWT Authentication
    const { error: authError } = await verifyAuth(req, supabase);
    if (authError) {
        return res.status(401).json({ error: authError });
    }

    const { generation_id } = req.query;

    if (!generation_id) {
        return res.status(400).json({ error: 'Missing generation_id parameter' });
    }

    try {
        console.log(`[LUMA-STATUS] Checking status for: ${generation_id}`);
        
        // Call Luma API to get generation status
        const lumaResponse = await fetch(`${LUMA_API_BASE}/generations/${generation_id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${LUMA_API_KEY}`,
                'Accept': 'application/json'
            }
        });

        if (!lumaResponse.ok) {
            if (lumaResponse.status === 404) {
                return res.status(404).json({ error: 'Generation not found' });
            }
            throw new Error(`Luma API error: ${lumaResponse.status}`);
        }

        const lumaResult = await lumaResponse.json();
        console.log(`[LUMA-STATUS] State: ${lumaResult.state}`);

        // Handle different states
        // Luma states: pending, processing, completed, failed
        
        if (lumaResult.state === 'completed') {
            const videoUrl = lumaResult.assets?.video;
            
            if (videoUrl) {
                console.log(`[LUMA-STATUS] Video ready: ${videoUrl}`);
                
                // Get generation record
                const { data: generation } = await supabase
                    .from('generations')
                    .select('user_id, prompt, input_params')
                    .eq('replicate_id', generation_id)
                    .single();

                let persistedUrl = videoUrl;
                let persistenceSuccess = false;
                
                // Persist to Supabase
                if (generation?.user_id) {
                    try {
                        const filename = `${generation.user_id}/video_${Date.now()}_luma.mp4`;
                        console.log(`[LUMA-STATUS] Persisting to: ${filename}`);
                        persistedUrl = await uploadToSupabase(videoUrl, filename, supabase);
                        persistenceSuccess = true;
                        console.log(`[LUMA-STATUS] Persisted: ${persistedUrl}`);
                    } catch (e) {
                        console.error('[LUMA-STATUS] Persistence failed:', e.message);
                    }
                    
                    // Update generation record
                    await supabase
                        .from('generations')
                        .update({ 
                            status: 'succeeded', 
                            progress: 100,
                            result_url: persistedUrl 
                        })
                        .eq('replicate_id', generation_id);
                }

                return res.status(200).json({
                    status: 'succeeded',
                    output: persistedUrl,
                    video_url: persistedUrl,
                    persistence_status: persistenceSuccess ? 'saved' : 'temporary',
                    lux_metadata: {
                        prompt_structure: {
                            user_prompt: generation?.prompt || 'AI Generated Video'
                        },
                        generation_config: generation?.input_params || {}
                    }
                });
            }
        }

        if (lumaResult.state === 'failed') {
            console.error('[LUMA-STATUS] Generation failed:', lumaResult.failure_reason);

            // Refund credits from generation record
            const { data: genRefund } = await supabase
                .from('generations')
                .select('user_id, cost_in_credits')
                .eq('replicate_id', generation_id)
                .single();

            if (genRefund?.user_id) {
                const refundAmount = genRefund.cost_in_credits || 250;
                const { error: refundErr } = await supabase.rpc('increase_credits', {
                    user_id: genRefund.user_id,
                    amount: refundAmount
                });
                if (refundErr) {
                    console.error('[LUMA-STATUS] REFUND FAILED - CRITICAL:', refundErr);
                } else {
                    console.log(`[LUMA-STATUS] Refund ${refundAmount} CR to ${genRefund.user_id}`);
                }
            }
            
            // Update generation record
            await supabase
                .from('generations')
                .update({ status: 'failed' })
                .eq('replicate_id', generation_id);
            
            return res.status(200).json({
                status: 'failed',
                refunded: true,
                error: lumaResult.failure_reason || 'Generation failed'
            });
        }

        // Still processing
        const progress = lumaResult.state === 'pending' ? 10 : 
                        lumaResult.state === 'processing' ? 50 : 0;

        return res.status(200).json({
            status: 'processing',
            progress,
            state: lumaResult.state
        });

    } catch (error) {
        console.error('[LUMA-STATUS] Error:', error instanceof Error ? error.message : 'Unknown');
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
