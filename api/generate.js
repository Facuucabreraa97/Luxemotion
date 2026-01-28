// api/generate.js
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp'; // Node.js native module

// SWITCH TO NODEJS RUNTIME FOR SHARP SUPPORT
export const config = {
    // runtime: 'edge', // Disabled to support Sharp
    maxDuration: 60, // Set timeout for Node functions
};
export const dynamic = 'force-dynamic'; // Prevent static optimization and timeouts

export default async function handler(request) {
    const token = process.env.REPLICATE_API_TOKEN;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!token || !supabaseUrl || !supabaseServiceKey) {
        return new Response(JSON.stringify({ error: "Configuration Error: Missing Envs" }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }

    const replicate = new Replicate({ auth: token });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(request.url);

    try {
        // --- AUTHENTICATION CHECK ---
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
             return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }
        
        // Verify User Token
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) {
             return new Response(JSON.stringify({ error: "Unauthorized Token" }), { status: 401 });
        }

        if (request.method === 'GET') {
            const id = url.searchParams.get('id');
            const prediction = await replicate.predictions.get(id);
            return new Response(JSON.stringify(prediction), { status: 200, headers: { 'content-type': 'application/json' } });
        }

        const body = await request.json();
        const { 
            start_image_url, subject_image_url,
            end_image_url, context_image_url,
            aspect_ratio = '16:9', prompt_structure, prompt,
            duration = "5", seed: userSeed
        } = body;

        const finalStartImage = start_image_url || subject_image_url;
        const finalEndImage = end_image_url || context_image_url;
        const durationStr = String(duration);
        const cost = durationStr === "10" ? 100 : 50;

        // Balance Check
        const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
        if (!profile || profile.credits < cost) {
            return new Response(JSON.stringify({ error: "Insufficient Credits" }), { status: 402, headers: { 'content-type': 'application/json' } });
        }

        // Deduct Credits
        const { error: deductError } = await supabase.rpc('decrease_credits', { user_id: user.id, amount: cost });
        if (deductError) {
             await supabase.from('profiles').update({ credits: profile.credits - cost }).eq('id', user.id);
        }

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
                const resultUrl = await composeScene(finalStartImage, finalEndImage, finalPrompt, replicate);
                if (resultUrl && resultUrl !== finalStartImage) {
                    composedImageUrl = resultUrl;
                    isComposited = true;
                } else {
                    throw new Error("Composition returned invalid result");
                }
             } catch (e) {
                 console.error("Composition Failed:", e);
                 // As per user instruction: If COMPOSITION fails, we abort to save credits/quality
                 return new Response(JSON.stringify({ 
                    error: "ASSET_MERGE_FAILED: No se pudo integrar el objeto en la escena. Operación abortada." 
                 }), { status: 422, headers: { 'content-type': 'application/json' } });
             }
        }

        // Payload Construction
        const inputPayload = {
            prompt: finalPrompt,
            input_image: isComposited ? composedImageUrl : (finalStartImage || undefined),
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

        return new Response(JSON.stringify({ 
            ...prediction,
            lux_metadata: { seed, generation_config: generationConfig, prompt_structure }
        }), { status: 201, headers: { 'content-type': 'application/json' } });

    } catch (error) {
        console.error("API Error:", error);
        return new Response(JSON.stringify({ error: error.message || "Unknown Error" }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
}

// --- HELPER: SCENE COMPOSITOR (Uses Sharp + SDXL) ---
async function composeScene(baseImage, objectImage, prompt, replicate) {
    console.log("Composing Scene: Fetching Buffers...");
    
    try {
        // 1. Fetch Images
        const [baseResp, objResp] = await Promise.all([ fetch(baseImage), fetch(objectImage) ]);
        if (!baseResp.ok || !objResp.ok) throw new Error("Failed to download input images");
        
        const baseBuffer = Buffer.from(await baseResp.arrayBuffer());
        const objBuffer = Buffer.from(await objResp.arrayBuffer());

        // 2. Process with Sharp (Collage/Overlay)
        // Resize object to 35% of base width
        const baseMeta = await sharp(baseBuffer).metadata();
        const targetWidth = Math.floor(baseMeta.width * 0.35);
        
        const resizedObj = await sharp(objBuffer)
            .resize({ width: targetWidth })
            .toBuffer();

        // Overlay: Bottom Right (with padding)
        const leftOffset = baseMeta.width - targetWidth - Math.floor(baseMeta.width * 0.05);
        const topOffset = baseMeta.height - Math.floor(baseMeta.height * 0.4); // Vertically centered-ish lower half

        const compositeBuffer = await sharp(baseBuffer)
            .composite([{ input: resizedObj, top: topOffset, left: leftOffset }])
            .png({ quality: 90 }) // OPTIMIZATION: Force high-quality PNG
            .toBuffer();
        
        // Convert to Data URI for Replicate
        const compositeBase64 = `data:image/png;base64,${compositeBuffer.toString('base64')}`;

        // 3. Refine with SDXL
        console.log("Collage Created. Refining with SDXL...");
        // Updated Prompt for seamless integration
        const compositionPrompt = `${prompt}, seamless composite, realistic lighting, shadows casting on hand, photorealistic, 8k, seamless integration, cinematic lighting`;

        const output = await replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", 
            {
                input: {
                    image: compositeBase64, // Send the collaged image
                    prompt: compositionPrompt,
                    strength: 0.45, // LOWER STRENGTH: Protect brand identity/text on product
                    refine: "expert_ensemble_refiner",
                    high_noise_frac: 0.8
                }
            }
        );
        
        if (output && output[0]) return output[0];
        throw new Error("No output from SDXL");

    } catch (e) {
        console.error("Sharp/Composition Error:", e);
        throw e; // Bubble up to main handler
    }
}
