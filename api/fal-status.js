// api/fal-status.js
// Poll fal.ai queue status for async video generation (Draft + Master)
import * as fal from "@fal-ai/serverless-client";
import { createClient } from '@supabase/supabase-js';

export const config = {
    maxDuration: 30,
};
export const dynamic = 'force-dynamic';

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

    const { request_id } = req.query;

    if (!request_id) {
        return res.status(400).json({ error: 'Missing request_id parameter' });
    }

    try {
        console.log(`[FAL-STATUS] Checking status for: ${request_id}`);
        
        // Look up the model ID from the generation record
        const { data: genRecord } = await supabase
            .from('generations')
            .select('fal_model_id, quality_tier, user_id, prompt, input_params')
            .eq('replicate_id', request_id)
            .single();
        
        // Use stored model ID, fallback to kling master
        const falModelId = genRecord?.fal_model_id || 'fal-ai/kling-video/v2/master/image-to-video';
        const qualityTier = genRecord?.quality_tier || 'master';
        console.log(`[FAL-STATUS] Model: ${falModelId} (${qualityTier})`);
        
        // Check fal.ai queue status
        const status = await fal.queue.status(falModelId, {
            requestId: request_id,
            logs: true
        });

        console.log(`[FAL-STATUS] Status:`, status.status);

        // If completed, get the result
        if (status.status === 'COMPLETED') {
            const result = await fal.queue.result(falModelId, {
                requestId: request_id
            });

            // Handle different response shapes per model
            // Video models return result.video.url, Flux images return result.images[0].url
            const videoUrl = result?.video?.url || result?.output?.video?.url || null;
            const imageUrl = result?.images?.[0]?.url || result?.output?.images?.[0]?.url || null;
            const outputUrl = videoUrl || imageUrl;
            const isImage = !videoUrl && !!imageUrl;
            
            if (outputUrl) {
                console.log(`[FAL-STATUS] ${isImage ? 'Image' : 'Video'} ready (${qualityTier}): ${outputUrl}`);
                
                // Use generation record we already fetched
                const generation = genRecord;

                let persistedUrl = outputUrl;
                let persistenceSuccess = false;
                
                // CRITICAL: Persist to Supabase - fal.ai URLs expire in ~24h
                if (generation?.user_id) {
                    try {
                        const ext = isImage ? 'png' : 'mp4';
                        const prefix = isImage ? 'image' : 'video';
                        const model = isImage ? 'flux' : 'kling';
                        const filename = `${generation.user_id}/${prefix}_${Date.now()}_${model}.${ext}`;
                        console.log(`[FAL-STATUS] Persisting ${prefix} to: ${filename}`);
                        persistedUrl = await uploadToSupabase(outputUrl, filename, supabase);
                        persistenceSuccess = true;
                        console.log(`[FAL-STATUS] ${prefix} persisted: ${persistedUrl}`);
                    } catch (e) {
                        console.error('[FAL-STATUS] CRITICAL: Video persistence FAILED:', e.message);
                        console.error('[FAL-STATUS] User will lose video after fal.ai expiry (~24h)');
                        // Still continue but mark as failed persistence
                    }
                    
                    // Update generation record
                    await supabase
                        .from('generations')
                        .update({ 
                            status: 'succeeded', 
                            progress: 100,
                            result_url: persistedUrl 
                        })
                        .eq('replicate_id', request_id);
                } else {
                    console.error('[FAL-STATUS] No user_id found - cannot persist video');
                }

                // Return with metadata for frontend saveDraft
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

        // Handle FAILED status with automatic refund
        if (status.status === 'FAILED') {
            console.error('[FAL-STATUS] Generation FAILED for:', request_id);

            if (genRecord?.user_id) {
                const refundAmount = genRecord.cost_in_credits;
                if (!refundAmount) {
                    console.error('[FAL-STATUS] CRITICAL: cost_in_credits is null — cannot determine refund amount for', request_id);
                } else {
                    const { error: refundErr } = await supabase.rpc('increase_credits', {
                        user_id: genRecord.user_id,
                        amount: refundAmount
                    });
                    if (refundErr) {
                        console.error('[FAL-STATUS] REFUND FAILED - CRITICAL:', refundErr instanceof Error ? refundErr.message : 'Unknown');
                    } else {
                        console.log(`[FAL-STATUS] Refund ${refundAmount} CR to ${genRecord.user_id}`);
                    }
                }

                await supabase.from('generations')
                    .update({ status: 'failed' })
                    .eq('replicate_id', request_id);
            }

            return res.status(200).json({
                status: 'failed',
                refunded: true,
                logs: status.logs || []
            });
        }

        // Still processing
        const progress = status.status === 'IN_QUEUE' ? 10 : 
                        status.status === 'IN_PROGRESS' ? 50 : 0;

        return res.status(200).json({
            status: 'processing',
            progress,
            queue_position: status.queue_position || null,
            logs: status.logs || []
        });

    } catch (error) {
        console.error('[FAL-STATUS] Error:', error instanceof Error ? error.message : 'Unknown');
        
        // Check if it's a "not found" error
        if (error.message?.includes('not found') || error.status === 404) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
