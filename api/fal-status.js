// api/fal-status.js
// Poll fal.ai queue status for async video generation
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

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Missing environment variables' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { request_id } = req.query;

    if (!request_id) {
        return res.status(400).json({ error: 'Missing request_id parameter' });
    }

    try {
        console.log(`[FAL-STATUS] Checking status for: ${request_id}`);
        
        // Check fal.ai queue status
        const status = await fal.queue.status('fal-ai/kling-video/v2/master/image-to-video', {
            requestId: request_id,
            logs: true
        });

        console.log(`[FAL-STATUS] Status:`, status.status);

        // If completed, get the result
        if (status.status === 'COMPLETED') {
            const result = await fal.queue.result('fal-ai/kling-video/v2/master/image-to-video', {
                requestId: request_id
            });

            const videoUrl = result?.video?.url;
            
            if (videoUrl) {
                console.log(`[FAL-STATUS] Video ready: ${videoUrl}`);
                
                // Get user from generations table
                const { data: generation } = await supabase
                    .from('generations')
                    .select('user_id')
                    .eq('replicate_id', request_id)
                    .single();

                let persistedUrl = videoUrl;
                
                // Try to persist to Supabase
                if (generation?.user_id) {
                    try {
                        const filename = `${generation.user_id}/video_${Date.now()}_kling.mp4`;
                        persistedUrl = await uploadToSupabase(videoUrl, filename, supabase);
                        console.log(`[FAL-STATUS] Video persisted: ${persistedUrl}`);
                    } catch (e) {
                        console.warn('[FAL-STATUS] Persistence failed, using fal URL:', e.message);
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
                }

                return res.status(200).json({
                    status: 'succeeded',
                    output: persistedUrl,
                    video_url: persistedUrl
                });
            }
        }

        // Still processing or other status
        const progress = status.status === 'IN_QUEUE' ? 10 : 
                        status.status === 'IN_PROGRESS' ? 50 : 0;

        return res.status(200).json({
            status: status.status === 'FAILED' ? 'failed' : 'processing',
            progress,
            queue_position: status.queue_position || null,
            logs: status.logs || []
        });

    } catch (error) {
        console.error('[FAL-STATUS] Error:', error);
        
        // Check if it's a "not found" error
        if (error.message?.includes('not found') || error.status === 404) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        return res.status(500).json({ error: error.message || 'Unknown error' });
    }
}
