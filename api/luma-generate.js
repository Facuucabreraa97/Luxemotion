// api/luma-generate.js
// LUMA RAY3 - Virtual Product Placement Pipeline
// Alternative to Kling for better product identity preservation
import { createClient } from '@supabase/supabase-js';

export const config = {
    maxDuration: 120,
};
export const dynamic = 'force-dynamic';

const LUMA_API_BASE = 'https://api.lumalabs.ai/dream-machine/v1';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check for Luma API key
    const LUMA_API_KEY = process.env.LUMA_API_KEY;
    if (!LUMA_API_KEY) {
        return res.status(500).json({ 
            error: 'LUMA_API_KEY not configured',
            message: 'Please add LUMA_API_KEY to your environment variables'
        });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Missing Supabase configuration' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Auth check
        const authHeader = req.headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const token = authHeader.replace('Bearer ', '');
        
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Check credits
        const { data: profile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single();

        if (!profile || profile.credits < 1) {
            return res.status(402).json({ error: 'Insufficient credits' });
        }

        // Parse request body
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { 
            prompt,
            subject_image,  // Image 1: Person/Model
            product_image,  // Image 2: Product
            aspect_ratio = '16:9',
            duration = '5'
        } = body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Determine generation mode
        const hasKeyframes = subject_image && product_image;
        
        console.log('[LUMA] Starting generation...');
        console.log(`[LUMA] Mode: ${hasKeyframes ? 'keyframe' : 'text-to-video'}`);
        console.log(`[LUMA] Prompt: "${prompt.substring(0, 100)}..."`);

        // Build request payload
        let lumaPayload = {
            prompt: prompt,
            aspect_ratio: aspect_ratio,
            loop: false
        };

        // If we have both images, use keyframes for product placement
        if (hasKeyframes) {
            lumaPayload.keyframes = {
                frame0: {
                    type: 'image',
                    url: subject_image
                },
                frame1: {
                    type: 'image', 
                    url: product_image
                }
            };
            console.log('[LUMA] Using keyframes for product placement');
            console.log(`[LUMA] Frame 0 (Subject): ${subject_image.substring(0, 50)}...`);
            console.log(`[LUMA] Frame 1 (Product): ${product_image.substring(0, 50)}...`);
        } else if (subject_image) {
            // Single image mode - image-to-video
            lumaPayload.keyframes = {
                frame0: {
                    type: 'image',
                    url: subject_image
                }
            };
            console.log('[LUMA] Single image mode');
        }

        // Call Luma API
        const lumaResponse = await fetch(`${LUMA_API_BASE}/generations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${LUMA_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(lumaPayload)
        });

        if (!lumaResponse.ok) {
            const errorText = await lumaResponse.text();
            console.error('[LUMA] API Error:', errorText);
            throw new Error(`Luma API error: ${lumaResponse.status} - ${errorText}`);
        }

        const lumaResult = await lumaResponse.json();
        console.log('[LUMA] Generation started:', lumaResult.id);

        // Deduct credit
        await supabase.rpc('deduct_credit', { user_id: user.id, amount: 1 });

        // Store generation record
        await supabase.from('generations').insert({
            user_id: user.id,
            replicate_id: lumaResult.id,  // Store Luma ID
            status: 'processing',
            prompt: prompt,
            input_params: {
                mode: hasKeyframes ? 'luma-keyframes' : 'luma-single',
                subject_image,
                product_image,
                provider: 'luma'
            },
            progress: 0
        });

        // Return response compatible with frontend
        return res.status(201).json({
            id: lumaResult.id,
            status: 'processing',
            output: null,
            provider: 'luma-ray',
            lux_metadata: {
                mode: hasKeyframes ? 'luma-product-placement' : 'luma-image-to-video',
                prompt,
                aspect_ratio,
                duration
            }
        });

    } catch (error) {
        console.error('[LUMA] Error:', error);
        return res.status(500).json({ 
            error: error.message || 'Luma generation failed'
        });
    }
}
