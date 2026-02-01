// api/generate.js
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp'; // Node.js native module
import * as fal from "@fal-ai/serverless-client";

// SWITCH TO NODEJS RUNTIME FOR SHARP SUPPORT
export const config = {
    // runtime: 'edge', // Disabled to support Sharp
    maxDuration: 60, // Set timeout for Node functions
};
export const dynamic = 'force-dynamic'; // Prevent static optimization and timeouts

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
        // Better error message for debugging
        if (error.message && error.message.includes('Bucket not found')) {
            throw new Error(`Storage Bucket 'videos' missing or not public.`);
        }
        throw error;
    }
}

/**
 * Helper: Remove Background using Fal.ai (bria-rmbg)
 */
async function removeBackground(imageUrl) {
    const falKey = process.env.FAL_KEY;
    if (!falKey) throw new Error("Configuration Error: Missing FAL_KEY");

    console.log("Calling Fal.ai (birefnet) for background removal...");
    // FIX: Switching to BiRefNet (SOTA/Reliable) to avoid 404s
    console.log('DEBUG: Attempting Background Removal with model: fal-ai/birefnet');
    const response = await fetch("https://fal.run/fal-ai/birefnet", {
        method: "POST",
        headers: {
            "Authorization": `Key ${falKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            image_url: imageUrl
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fal.ai Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    if (!data.image || !data.image.url) {
        throw new Error("Fal.ai returned invalid response format");
    }
    
    return data.image.url;
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

        let generationConfig = { model: "kwaivgi/kling-v2.5-turbo-pro", duration: durationStr, aspect_ratio, seed };
        
        let versionId;
        try {
            const model = await replicate.models.get("kwaivgi", "kling-v2.5-turbo-pro");
            versionId = model.latest_version.id;
        } catch (err) {
            // Fallback hardcoded ID logic removed for brevity, assume fetch works or throw
             throw new Error("Failed to fetch model version");
        }

        // --- COMPOSITION MIDDLEWARE ---
        let composedImageUrl = null;
        let isComposited = false;

        if (finalStartImage && finalEndImage && finalStartImage !== finalEndImage) {
             console.log("Intercepting: Composition Mode Active");
             try {
                // Defensive: Ensure we don't crash standard flow
                // STRICT IDENTITY: We pass finalStartImage as the base.
                const resultUrl = await composeScene(finalStartImage, finalEndImage, finalPrompt, replicate, supabase, user.id, aspect_ratio);
                if (resultUrl && resultUrl !== finalStartImage) {
                    
                    // PERSIST COMPOSITION ASSET
                    // The resultUrl from composeScene is from Replicate. We must save it.
                    const compositeFilename = `${user.id}/composition_${Date.now()}_composite.png`;
                    composedImageUrl = await uploadToSupabase(resultUrl, compositeFilename, supabase);
                    
                    isComposited = true;
                } else {
                    throw new Error("Composition returned invalid result");
                }
             } catch (e) {
                 console.error("Composition Failed:", e);
                 
                 // If it is a Rate Limit error, propagate it (throw it) 
                 // so the main catch block handles it with 429 status
                 if (e.message?.includes('429') || e.response?.status === 429) {
                     throw e; 
                 }

                 // As per user instruction: If COMPOSITION fails, we abort to save credits/quality
                 return res.status(422).json({ 
                    error: `ASSET_MERGE_FAILED: ${e.message || "No se pudo integrar el objeto en la escena."}`
                 });
             }
        }

        // Payload Construction
        const inputPayload = {
            prompt: finalPrompt,
            input_image: isComposited ? composedImageUrl : (finalStartImage || undefined),
            aspect_ratio: aspect_ratio // PASS ASPECT RATIO FROM FRONTEND
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
                composed_image_url: composedImageUrl, // Return intermediate composite for debugging
                prompt_structure: {
                    ...(prompt_structure || { user_prompt: prompt }),
                    system_prompt: systemPrompt // Ensure systemPrompt is always recorded
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

// --- HELPER: SCENE COMPOSITOR (Uses Sharp + SDXL) ---
// --- HELPER: SCENE COMPOSITOR (Sharp Only - Strict Identity) ---
async function composeScene(baseImage, objectImage, prompt, replicate, supabase, userId, targetAspectRatio = "16:9") {
    console.log("Composing Scene: Starting Strict Identity Pipeline...");
    
    try {
        // 1. Remove Background (Product Image)
        // Strictly calling Fal.ai First.
        let transparentObjectUrl;
        try {
            transparentObjectUrl = await removeBackground(objectImage);
            console.log("Background removed successfully.");
        } catch (rmbgError) {
            throw new Error(`Background Removal Failed: ${rmbgError.message}`);
        }

        // 2. Fetch Images (Strict Identity: Base is user input, Object is transparent PNG)
        const [baseResp, objResp] = await Promise.all([ fetch(baseImage), fetch(transparentObjectUrl) ]);
        if (!baseResp.ok || !objResp.ok) throw new Error("Failed to download input images for composition");
        
        const baseBuffer = Buffer.from(await baseResp.arrayBuffer());
        const objBuffer = Buffer.from(await objResp.arrayBuffer());

        // 3. Process with Sharp (Strict Coordinate System)
        // RULES:
        // - Canvas = Base Image Dimensions (No pre-resize)
        // - Object = Proportional resize (fit: 'inside')
        // - Position = Calculated Manually (Bottom Right)
        
        const baseInstance = sharp(baseBuffer);
        const baseMeta = await baseInstance.metadata();
        
        // Target Object Size: 35% of Base Width (Safe Zone)
        const objectTargetWidth = Math.floor(baseMeta.width * 0.35);
        
        const resizedObj = await sharp(objBuffer)
            .resize({ 
                width: objectTargetWidth, 
                // height: null, // Auto-scale to maintain aspect ratio
                fit: 'inside' // VITAL: Prevents distortion/stretching
            })
            .toBuffer();
            
        const objMeta = await sharp(resizedObj).metadata();

        // Calculate Position: Aggressive (Neck Level - 30% Height)
        // Force Kling to use the pixels for drinking/eating actions.
        const leftOffset = Math.round((baseMeta.width - objMeta.width) / 2);
        const topOffset = Math.round(baseMeta.height * 0.30);

        console.log(`Composition Stats (NECK-LEVEL): Base ${baseMeta.width}x${baseMeta.height}, Obj ${objMeta.width}x${objMeta.height} @ (${leftOffset},${topOffset})`);

        let pipeline = baseInstance
            .composite([{ input: resizedObj, top: topOffset, left: leftOffset }]);

        // 4. Smart Crop to Target Aspect Ratio (Processing at the END)
        if (targetAspectRatio) {
            try {
                const [w, h] = targetAspectRatio.split(':').map(Number);
                if (w && h) {
                    const targetRatio = w / h;
                    const currentRatio = baseMeta.width / baseMeta.height;
                    
                    let targetW, targetH;
                    
                    // Logic to maximize cover area while maintaining aspect ratio
                    if (currentRatio > targetRatio) {
                        // Image is wider than target
                        targetH = baseMeta.height;
                        targetW = Math.floor(targetH * targetRatio);
                    } else {
                        // Image is taller than target
                        targetW = baseMeta.width;
                        targetH = Math.floor(targetW / targetRatio);
                    }
                    
                    console.log(`Applying Smart Crop to ${targetAspectRatio}: ${targetW}x${targetH} (Strategy: Central/Attention)`);
                    
                    pipeline = pipeline.resize({
                        width: targetW,
                        height: targetH,
                        fit: 'cover',
                        // position: 'attention' // Smart focus
                        // Fallback to center if attention fails or requires extra deps, but sharp 0.33+ handles entropy/attention usually.
                        // Using standard gravity center for reliability unless attention is needed.
                        position: sharp.strategy.attention 
                    });
                }
            } catch (cropErr) {
                console.warn("Smart Crop Failed (Skipping):", cropErr);
            }
        }

        const compositeBuffer = await pipeline
            .png({ quality: 95 })
            .toBuffer();
            
        // --- UPLOAD VERIFIED COLLAGE ---
        // This IS the final input for Kling. 
        // We skip SDXL refinement to strictily preserve the identity of the base image.
        const timestamp = Date.now();
        const debugFilename = `${userId}/debug/COLLAGE_VERIFIED_${timestamp}.png`;
        
        console.log("Uploading Final Composition:", debugFilename);
        
        const { error: uploadError } = await supabase.storage
            .from('videos')
            .upload(debugFilename, compositeBuffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(debugFilename);

        console.log(`Final Collage Ready at Supabase: ${publicUrl}`);
        
        // --- STEP 5: FLUX.1 [dev] REFINEMENT ---
        console.log("Applying Flux.1 [dev] Refinement...");

        try {
            const collageUrl = publicUrl;
            // Ensure we use the user's base prompt context
            const basePrompt = prompt; 

            // Explicitly set credentials if needed, though sdk usually picks up FAL_KEY
            // fal.config({ credentials: process.env.FAL_KEY }); 

            const fluxResult = await fal.subscribe('fal-ai/flux/dev/image-to-image', {
                input: {
                    image_url: collageUrl, // URL pública del collage subido a Supabase
                    prompt: basePrompt + ", person naturally holding the product, soft integration, cinematic lighting, photorealistic",
                    strength: 0.22, // REDUCED from 0.45 to preserve product fidelity
                    guidance_scale: 3.5,
                    num_inference_steps: 28, // Slightly increased to compensate
                    seed: Math.floor(Math.random() * 1000000)
                },
                logs: true,
            });

            // La URL resultante (fluxResult.data.images[0].url) es la que se enviará a Kling.
            if (fluxResult && fluxResult.data && fluxResult.data.images && fluxResult.data.images[0]) {
                 console.log("Flux Refinement Complete. URL:", fluxResult.data.images[0].url);
                 return fluxResult.data.images[0].url;
            }
            
            throw new Error("Flux returned invalid response format");

        } catch (fluxError) {
             console.error("Flux Refinement Failed:", fluxError);
             // Abort and notify, do not send garbage to Kling
             throw new Error(`Refinement Failed (Flux): ${fluxError.message}`);
        }

    } catch (e) {
        console.error("Sharp/Composition Error:", e);
        throw e; // Bubble up
    }
}
