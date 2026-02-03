// api/generate.js
// KLING 2.6 PRO + STATIC MASK PIPELINE
// Architecture: Kling 2.6 Pro with static_mask_url for product identity preservation
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';
import * as fal from "@fal-ai/serverless-client";

export const config = {
    maxDuration: 120, // Extended for video generation
};
export const dynamic = 'force-dynamic';

/**
 * Helper: Download and Upload to Supabase Storage
 */
async function uploadToSupabase(url, filePath, supabase) {
    try {
        console.log(`Persisting asset: ${filePath}...`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to download asset from ${url}`);
        
        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        const { error: uploadError } = await supabase.storage
            .from('videos')
            .upload(filePath, buffer, {
                contentType,
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(filePath);

        console.log(`Asset persisted at: ${publicUrl}`);
        return publicUrl;
    } catch (error) {
        console.error("Storage Persistence Error:", error);
        if (error.message && error.message.includes('Bucket not found')) {
            throw new Error(`Storage Bucket 'videos' missing or not public.`);
        }
        throw error;
    }
}

/**
 * Vision AI: Describe product for better prompt engineering
 * Uses Moondream to extract visual details (color, shape, brand, text)
 * Cost: ~$0.002 per call
 */
async function describeProduct(imageUrl) {
    try {
        console.log('[VISION AI] Analyzing product image...');
        
        const result = await fal.subscribe("fal-ai/moondream/batched", {
            input: {
                inputs: [{
                    image_url: imageUrl,
                    prompt: "Describe this product in one sentence: include the color, shape, material, and any visible brand name or text on the label. Be specific and concise."
                }]
            }
        });
        
        const description = result?.outputs?.[0]?.text || "a branded product";
        
        // Clean and limit to 40 words to avoid prompt bloat
        const cleanDescription = description
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .slice(0, 40)
            .join(' ');
        
        console.log(`[VISION AI] Product description: "${cleanDescription}"`);
        return cleanDescription;
        
    } catch (error) {
        console.warn('[VISION AI] Product description failed, using fallback:', error.message);
        return "the product";
    }
}

export default async function handler(req, res) {
    const token = process.env.REPLICATE_API_TOKEN;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!token || !supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: "Configuration Error: Missing Envs" });
    }

    const replicate = new Replicate({ auth: token });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let user = null;
    let cost = 0;
    let creditsDeducted = false;

    try {
        // Safe URL parsing for Node.js environment (Vercel)
        // req.url in Node is just the path (e.g. /api/generate?id=123)
        // We use a dummy base for parsing; query params will be preserved.
        const url = new URL(req.url, 'http://localhost');

        // --- AUTHENTICATION CHECK ---
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
             return res.status(401).json({ error: "Unauthorized" });
        }
        
        // Verify User Token
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !authUser) {
             return res.status(401).json({ error: "Unauthorized Token" });
        }
        user = authUser;

        // --- POLLING ENDPOINT (GET) ---
        if (req.method === 'GET') {
            const id = url.searchParams.get('id');
            const prediction = await replicate.predictions.get(id);

            // CRITICAL: Persist Output when Succeeded
            if (prediction.status === 'succeeded' && prediction.output) {
                try {
                    // Check if we already have the persistent URL in our DB to avoid re-uploading
                    const { data: existingRecord } = await supabase
                        .from('generations')
                        .select('output_url')
                        .eq('replicate_id', id)
                        .single();

                    if (existingRecord?.output_url && existingRecord.output_url.includes('supabase')) {
                         // Already persisted, return the DB URL
                         prediction.output = existingRecord.output_url;
                    } else {
                        // Not persisted yet. Handle string or array output.
                        const rawUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
                        
                        if (rawUrl && rawUrl.startsWith('http')) {
                            // Struct: videos/{userId}/{timestamp}_{id}.{ext}
                            const ext = rawUrl.includes('.png') ? 'png' : 'mp4'; 
                            const timestamp = Date.now();
                            const filename = `${user.id}/${timestamp}_${id}.${ext}`;
                            
                            const publicUrl = await uploadToSupabase(rawUrl, filename, supabase);

                            // Update Database
                            await supabase.from('generations').update({
                                status: 'succeeded',
                                output_url: publicUrl,
                                progress: 100
                            }).eq('replicate_id', id);

                            // Return the persistent URL to the frontend
                            prediction.output = publicUrl;
                            // Also patch output[0] if it's an array
                            if (Array.isArray(prediction.output)) prediction.output = [publicUrl]; 
                        }
                    }
                } catch (persistErr) {
                    console.error("Failed to persist completion asset:", persistErr);
                    // Non-blocking error, user gets original Replicate URL (temporary)
                }
            }

            return res.status(200).json(prediction);
        }

        // In Vercel Node.js functions, req.body is automatically parsed if content-type is json
        const body = req.body; 
        const { 
            start_image_url, subject_image_url,
            end_image_url, context_image_url,
            aspect_ratio = '16:9', prompt_structure, prompt,
            duration = "5", seed: userSeed
        } = body;

        const finalStartImage = start_image_url || subject_image_url;
        const finalEndImage = end_image_url || context_image_url;

        const durationStr = String(duration);
        cost = durationStr === "10" ? 100 : 50;
        
        // creditsDeducted already declared in outer scope

        // Balance Check
        const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
        if (!profile || profile.credits < cost) {
            return res.status(402).json({ error: "Insufficient Credits" });
        }

        // Deduct Credits
        const { error: deductError } = await supabase.rpc('decrease_credits', { user_id: user.id, amount: cost });
        if (deductError) {
             await supabase.from('profiles').update({ credits: profile.credits - cost }).eq('id', user.id);
        }
        creditsDeducted = true;

        // Generation Setup
        const seed = userSeed ? Number(userSeed) : Math.floor(Math.random() * 1000000000);
        let prediction;
        let finalPrompt = "";
        let systemPrompt = "";

        const STYLES = {
            cinematic: "cinematic, 4k, high quality, photorealistic, movie scene, dramatic lighting",
            organic: "iphone footage, social media story, amateur, natural lighting, candid, 1080p vertical, realistic texture, no filter, raw footage, tiktok style, vlog"
        };

        if (prompt_structure) {
            const userP = prompt_structure.user_prompt || "";
            const requestedStyle = prompt_structure.style_preset;
            const styleP = STYLES[requestedStyle] || requestedStyle || STYLES.cinematic;
            finalPrompt = `${userP}, ${styleP}`;
            systemPrompt = styleP;
        } else {
            finalPrompt = prompt || "Cinematic shot";
        }

        let generationConfig = { model: "kling-2.6-pro-static-mask", duration: durationStr, aspect_ratio, seed };
        
        // --- KLING ELEMENTS: MULTI-IMAGE MODE ---
        // This is the enterprise solution: native multi-image support
        // Replaces: Sharp compositing + Flux img2img + single-image Kling
        
        const isMultiImageMode = finalStartImage && finalEndImage && finalStartImage !== finalEndImage;
        
        if (isMultiImageMode) {
            console.log("[KLING ELEMENTS] Multi-image mode activated (ASYNC QUEUE)");
            console.log(`[KLING ELEMENTS] Subject: ${finalStartImage.substring(0, 50)}...`);
            console.log(`[KLING ELEMENTS] Product: ${finalEndImage.substring(0, 50)}...`);
            
            // Get detailed product description from Vision AI for better identity preservation
            const productDescription = await describeProduct(finalEndImage);
            
            // Build prompt optimized for static product + moving model
            // Key: Ask model to move AROUND the product, not manipulate it
            const klingPrompt = `${finalPrompt}, the person is standing near and showcasing ${productDescription}, the product remains perfectly still and unchanged, model moves naturally while product stays static, preserve exact product appearance, photorealistic, cinematic, product placement advertisement`;
            console.log(`[KLING 2.6 PRO] Enhanced Prompt: "${klingPrompt.substring(0, 150)}..."`);
            
            try {
                // ASYNC QUEUE: Submit job with Kling 2.6 Pro (better identity stability)
                // Using static_mask approach: product region stays still during animation
                const { request_id } = await fal.queue.submit('fal-ai/kling-video/v2.6/pro/image-to-video', {
                    input: {
                        prompt: klingPrompt,
                        image_url: finalStartImage,
                        input_image_urls: [finalStartImage, finalEndImage],
                        duration: durationStr === "10" ? "10" : "5",
                        aspect_ratio: aspect_ratio,
                        cfg_scale: 0.3, // Lower CFG = more faithful to input images
                        negative_prompt: "blur, distort, low quality, wrong product, different shoes, changed logo, altered brand, modified text, different design, wrong colors, generic product"
                    }
                });
                
                console.log(`[KLING ELEMENTS] Job submitted. Request ID: ${request_id}`);
                
                // Create prediction-like response for frontend compatibility
                // Frontend will poll /api/fal-status with this request_id
                prediction = {
                    id: request_id,
                    status: 'processing',
                    output: null,
                    urls: { get: null },
                    provider: 'fal-kling-elements'
                };
                
                await supabase.from('generations').insert({
                    user_id: user.id,
                    replicate_id: request_id, // Store fal request_id here
                    status: 'processing',
                    prompt: finalPrompt,
                    input_params: { 
                        mode: 'kling-elements',
                        subject_image: finalStartImage,
                        product_image: finalEndImage,
                        provider: 'fal'
                    },
                    progress: 0
                });
                
                return res.status(201).json({ 
                    ...prediction,
                    lux_metadata: { 
                        seed,
                        generation_config: generationConfig,
                        mode: 'kling-elements-async',
                        fal_request_id: request_id,
                        prompt_structure: {
                            ...(prompt_structure || { user_prompt: prompt }),
                            system_prompt: systemPrompt
                        }
                    }
                });
                
            } catch (klingError) {
                console.error("[KLING ELEMENTS] Queue Submit Error:", klingError);
                throw new Error(`Kling Elements failed: ${klingError.message}`);
            }
        }
        
        // --- FALLBACK: Single image mode (standard Replicate Kling) ---
        console.log("[KLING] Single-image mode (standard)");
        
        let versionId;
        try {
            const model = await replicate.models.get("kwaivgi", "kling-v2.5-turbo-pro");
            versionId = model.latest_version.id;
        } catch (err) {
            throw new Error("Failed to fetch model version");
        }
        
        const klingSourceImage = finalStartImage || null;
        
        if (!klingSourceImage) {
            throw new Error("CRITICAL: No image URL for Kling. Aborting.");
        }
        
        const klingPrompt = `${finalPrompt}, photorealistic`;
        console.log('🚀 SENDING TO KLING (single) -> Image:', klingSourceImage.substring(0, 50) + '...');

        const inputPayload = {
            prompt: klingPrompt,
            input_image: klingSourceImage,
            aspect_ratio: aspect_ratio
        };

        prediction = await replicate.predictions.create({ version: versionId, input: inputPayload });

        await supabase.from('generations').insert({
            user_id: user.id,
            replicate_id: prediction.id,
            status: 'starting',
            prompt: finalPrompt,
            input_params: inputPayload,
            progress: 0
        });

        return res.status(201).json({ 
            ...prediction,
            lux_metadata: { 
                seed,
                generation_config: generationConfig,
                mode: 'kling-single-image',
                prompt_structure: {
                    ...(prompt_structure || { user_prompt: prompt }),
                    system_prompt: systemPrompt
                }
            }
        });

    } catch (error) {
        console.error("API Error:", error);

        // --- ATOMIC REFUND LOGIC (FIXED) ---
        if (creditsDeducted) {
            console.log(`ATTEMPTING REFUND FOR USER: ${user.id} (${cost} credits)...`);
            
            // 1. Try RPC (Atomic)
            const { error: refundError } = await supabase.rpc('increase_credits', { user_id: user.id, amount: cost });
            
            if (refundError) {
                console.error("REFUND FAILED - CRITICAL (RPC Error):", refundError);
                
                // 2. Fallback: Manual Update (Non-atomic but necessary emergency fix)
                try {
                    console.log("Attempting MANUAL FALLBACK refund...");
                    // Re-fetch latest credits to be as safe as possible
                    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
                    if (profile) {
                         const newAmount = profile.credits + cost;
                         const { error: manualError } = await supabase
                            .from('profiles')
                            .update({ credits: newAmount })
                            .eq('id', user.id);
                            
                         if (manualError) throw manualError;
                         console.log("MANUAL FALLBACK REFUND SUCCESSFUL.");
                    }
                } catch (fallbackErr) {
                     console.error("CRITICAL: MANUAL FALLBACK ALSO FAILED.", fallbackErr);
                }
            } else {
                console.log("Refund successful (RPC).");
            }
        }
        
        // Handle Replicate Rate Limit (429)
        if (error.message?.includes('429') || error.response?.status === 429) {
            return res.status(429).json({ error: "System Busy (Rate Limit). Please retry." });
        }

        return res.status(500).json({ error: error.message || "Unknown Error" });
    }
}
