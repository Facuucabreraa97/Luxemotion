// api/generate.js
// HYBRID GENERATION PIPELINE: Draft (Wan-2.1) + Master (Kling v2.5)
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';
import * as fal from "@fal-ai/serverless-client";
import { rateLimit } from './lib/rateLimit.js';

export const config = {
    maxDuration: 120,
};
export const dynamic = 'force-dynamic';

// ── TIER CONFIGURATION ──────────────────────────────────────
// COST MATRIX (server-side source of truth — never trust frontend)
// Real API costs: Kling Master $1.40/5s, $2.80/10s
const TIER_CONFIG = {
    image: {
        credits: 15,
        fal_model_id: 'fal-ai/flux/dev/image-to-image',
        fal_model_t2i: 'fal-ai/flux/dev',
        label: 'Image (Flux)'
    },
    draft: {
        credits: 50,
        fal_model_id: 'fal-ai/wan-i2v',
        label: 'Draft (Wan-2.1)',
        params: { resolution: '480p', num_frames: 81 }
    },
    master: {
        credits_5s: 400,
        credits_10s: 800,
        fal_model_id: 'fal-ai/kling-video/v2/master/image-to-video',
        label: 'Master (Kling v2.5 Pro)',
        params: {}
    }
};

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

        // Rate limit: 5 generation requests per minute
        if (rateLimit(req, res, { maxRequests: 5, windowMs: 60000 })) return;

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
            duration = "5", seed: userSeed,
            tier = 'master', // 'draft', 'master', or 'image'
            type = 'video'   // 'video' or 'image'
        } = body;

        const finalStartImage = start_image_url || subject_image_url;
        const finalEndImage = end_image_url || context_image_url;

        const durationStr = String(duration);
        
        // COST CALCULATION (server-side rigid matrix)
        const tierConfig = type === 'image' ? TIER_CONFIG.image : (TIER_CONFIG[tier] || TIER_CONFIG.master);
        if (type === 'image') {
            cost = tierConfig.credits;
            console.log(`[IMAGE] Flux generation — Cost: ${cost} CR`);
        } else if (tier === 'draft') {
            cost = tierConfig.credits;
            console.log(`[TIER] ${tierConfig.label} ${durationStr}s — Cost: ${cost} CR`);
        } else {
            cost = durationStr === '10' ? tierConfig.credits_10s : tierConfig.credits_5s;
            console.log(`[TIER] ${tierConfig.label} ${durationStr}s — Cost: ${cost} CR`);
        }

        // Balance Check
        const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
        if (!profile || profile.credits < cost) {
            return res.status(402).json({ error: `Insufficient Credits. ${tierConfig.label} costs ${cost} CR.` });
        }

        // Deduct Credits (atomic RPC — no fallback to direct UPDATE)
        const { error: deductError } = await supabase.rpc('decrease_credits', { p_user_id: user.id, p_amount: cost });
        if (deductError) {
            console.error('Credit deduction RPC failed:', deductError.message);
            return res.status(402).json({ error: 'Credit deduction failed. Please try again.' });
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

        let generationConfig = { model: tierConfig.label, duration: type === 'image' ? 'N/A' : durationStr, aspect_ratio, seed, tier: type === 'image' ? 'image' : tier };

        // ═══════════════════════════════════════════════════════
        // IMAGE GENERATION: Flux via fal.ai (15 CR)
        // ═══════════════════════════════════════════════════════
        if (type === 'image') {
            console.log(`[IMAGE] Flux generation starting...`);
            const fluxModel = finalStartImage ? TIER_CONFIG.image.fal_model_id : TIER_CONFIG.image.fal_model_t2i;
            const fluxInput = finalStartImage
                ? { prompt: finalPrompt, image_url: finalStartImage, strength: 0.75, image_size: aspect_ratio === '9:16' ? { width: 768, height: 1344 } : aspect_ratio === '1:1' ? { width: 1024, height: 1024 } : { width: 1344, height: 768 }, num_inference_steps: 28, guidance_scale: 3.5, enable_safety_checker: false }
                : { prompt: finalPrompt, image_size: aspect_ratio === '9:16' ? { width: 768, height: 1344 } : aspect_ratio === '1:1' ? { width: 1024, height: 1024 } : { width: 1344, height: 768 }, num_inference_steps: 28, guidance_scale: 3.5, enable_safety_checker: false };

            try {
                const { request_id } = await fal.queue.submit(fluxModel, { input: fluxInput });
                console.log(`[IMAGE] Job submitted: ${request_id}`);

                prediction = {
                    id: request_id,
                    status: 'processing',
                    output: null,
                    urls: { get: null },
                    provider: 'fal-flux-image'
                };

                await supabase.from('generations').insert({
                    user_id: user.id,
                    replicate_id: request_id,
                    status: 'processing',
                    prompt: finalPrompt,
                    input_params: {
                        mode: 'image',
                        image: finalStartImage || null,
                        provider: 'fal'
                    },
                    progress: 0,
                    quality_tier: 'image',
                    cost_in_credits: cost,
                    fal_model_id: fluxModel
                });

                return res.status(201).json({
                    ...prediction,
                    lux_metadata: {
                        seed,
                        generation_config: generationConfig,
                        mode: 'flux-image',
                        fal_request_id: request_id,
                        tier: 'image',
                        prompt_structure: {
                            ...(prompt_structure || { user_prompt: prompt }),
                            system_prompt: systemPrompt
                        }
                    }
                });
            } catch (imageError) {
                console.error('[IMAGE] Error:', imageError);
                throw new Error(`Image generation failed: ${imageError.message}`);
            }
        }
        
        // ═══════════════════════════════════════════════════════
        // DRAFT TIER: Wan-2.1 via fal.ai (fast, cheap)
        // ═══════════════════════════════════════════════════════
        if (tier === 'draft' && finalStartImage) {
            console.log(`[DRAFT] Wan-2.1 generation starting...`);
            
            try {
                const { request_id } = await fal.queue.submit(tierConfig.fal_model_id, {
                    input: {
                        prompt: finalPrompt,
                        image_url: finalStartImage,
                        image_size: { width: 854, height: 480 },
                        num_frames: 81,
                        enable_safety_checker: false
                    }
                });
                
                console.log(`[DRAFT] Job submitted: ${request_id}`);
                
                prediction = {
                    id: request_id,
                    status: 'processing',
                    output: null,
                    urls: { get: null },
                    provider: 'fal-draft'
                };
                
                await supabase.from('generations').insert({
                    user_id: user.id,
                    replicate_id: request_id,
                    status: 'processing',
                    prompt: finalPrompt,
                    input_params: { 
                        mode: 'draft',
                        image: finalStartImage,
                        provider: 'fal'
                    },
                    progress: 0,
                    quality_tier: 'draft',
                    cost_in_credits: cost,
                    fal_model_id: tierConfig.fal_model_id
                });
                
                return res.status(201).json({ 
                    ...prediction,
                    lux_metadata: { 
                        seed,
                        generation_config: generationConfig,
                        mode: 'draft-wan21',
                        fal_request_id: request_id,
                        tier: 'draft',
                        prompt_structure: {
                            ...(prompt_structure || { user_prompt: prompt }),
                            system_prompt: systemPrompt
                        }
                    }
                });
            } catch (draftError) {
                console.error("[DRAFT] Error:", draftError);
                throw new Error(`Draft generation failed: ${draftError.message}`);
            }
        }
        
        // ═══════════════════════════════════════════════════════
        // MASTER TIER: Kling Elements Multi-Image (async queue)
        // ═══════════════════════════════════════════════════════
        const isMultiImageMode = finalStartImage && finalEndImage && finalStartImage !== finalEndImage;
        
        if (isMultiImageMode) {
            console.log("[MASTER] Multi-image mode activated (ASYNC QUEUE)");
            console.log(`[MASTER] Subject: ${finalStartImage.substring(0, 50)}...`);
            console.log(`[MASTER] Product: ${finalEndImage.substring(0, 50)}...`);
            
            const productDescription = await describeProduct(finalEndImage);
            
            const klingPrompt = `${finalPrompt}, the person is naturally holding and presenting ${productDescription}, preserve exact product appearance and any visible text/labels, photorealistic, cinematic`;
            console.log(`[MASTER] Enhanced Prompt: "${klingPrompt.substring(0, 150)}..."`);
            
            try {
                const { request_id } = await fal.queue.submit(tierConfig.fal_model_id, {
                    input: {
                        prompt: klingPrompt,
                        image_url: finalStartImage,
                        input_image_urls: [finalStartImage, finalEndImage],
                        duration: durationStr === "10" ? "10" : "5",
                        aspect_ratio: aspect_ratio,
                        cfg_scale: 0.5,
                        negative_prompt: "blur, distort, low quality, wrong product, different person"
                    }
                });
                
                console.log(`[MASTER] Job submitted: ${request_id}`);
                
                prediction = {
                    id: request_id,
                    status: 'processing',
                    output: null,
                    urls: { get: null },
                    provider: 'fal-kling-elements'
                };
                
                await supabase.from('generations').insert({
                    user_id: user.id,
                    replicate_id: request_id,
                    status: 'processing',
                    prompt: finalPrompt,
                    input_params: { 
                        mode: 'kling-elements',
                        subject_image: finalStartImage,
                        product_image: finalEndImage,
                        provider: 'fal'
                    },
                    progress: 0,
                    quality_tier: 'master',
                    cost_in_credits: cost,
                    fal_model_id: tierConfig.fal_model_id
                });
                
                return res.status(201).json({ 
                    ...prediction,
                    lux_metadata: { 
                        seed,
                        generation_config: generationConfig,
                        mode: 'kling-elements-async',
                        fal_request_id: request_id,
                        tier: 'master',
                        prompt_structure: {
                            ...(prompt_structure || { user_prompt: prompt }),
                            system_prompt: systemPrompt
                        }
                    }
                });
                
            } catch (klingError) {
                console.error("[MASTER] Queue Submit Error:", klingError);
                throw new Error(`Kling Elements failed: ${klingError.message}`);
            }
        }
        
        // --- FALLBACK: Single image mode (standard Replicate Kling) ---
        console.log(`[MASTER] Single-image mode (standard Replicate)`);
        
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
            progress: 0,
            quality_tier: 'master',
            cost_in_credits: cost
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
        console.error("API Error:", error instanceof Error ? error.message : 'Unknown');

        // --- ATOMIC REFUND LOGIC ---
        if (creditsDeducted) {
            console.log(`ATTEMPTING REFUND FOR USER: ${user.id} (${cost} credits)...`);
            
            const { error: refundError } = await supabase.rpc('increase_credits', { user_id: user.id, amount: cost });
            
            if (refundError) {
                console.error("REFUND FAILED - CRITICAL:", refundError?.message || refundError);
            } else {
                console.log("Refund successful (RPC).");
            }
        }
        
        // Handle Replicate Rate Limit (429)
        if (error.message?.includes('429') || error.response?.status === 429) {
            return res.status(429).json({ error: "System Busy (Rate Limit). Please retry." });
        }

        return res.status(500).json({ error: "Internal Server Error" });
    }
}
