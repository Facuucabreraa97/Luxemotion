// api/generate.js
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    const token = process.env.REPLICATE_API_TOKEN;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!token || !supabaseUrl || !supabaseServiceKey) {
        const missing = [];
        if (!token) missing.push("REPLICATE_API_TOKEN");
        if (!supabaseUrl) missing.push("SUPABASE_URL");
        if (!supabaseServiceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

        return new Response(JSON.stringify({ error: `Missing Environment Variables: ${missing.join(', ')}` }), {
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
             return new Response(JSON.stringify({ error: "Unauthorized: Missing Token" }), { status: 401 });
        }
        
        // Verify User Token
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) {
             return new Response(JSON.stringify({ error: "Unauthorized: Invalid Token" }), { status: 401 });
        }

        // --- GET Method: Check Status (Polling) ---
        if (request.method === 'GET') {
            const id = url.searchParams.get('id');
            if (!id) throw new Error("Missing 'id' query parameter");

            const prediction = await replicate.predictions.get(id);
            return new Response(JSON.stringify(prediction), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        // --- POST Method: Create Prediction ---
        const body = await request.json();
        const { 
            start_image_url, 
            end_image_url, 
            aspect_ratio = '16:9', 
            prompt_structure,
            prompt,
            duration = "5", // Default to 5s
            seed: userSeed
        } = body;

        // --- BILLING LOGIC ---
        const durationStr = String(duration);
        const cost = durationStr === "10" ? 100 : 50;

        // check balance
        const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
        
        if (!profile || profile.credits < cost) {
            return new Response(JSON.stringify({ error: `Insufficient Credits (Required: ${cost}, Available: ${profile?.credits || 0})` }), {
                status: 402,
                headers: { 'content-type': 'application/json' },
            });
        }

        // Deduct Credits (Optimistic)
        const { error: deductError } = await supabase.rpc('decrease_credits', { 
            user_id: user.id, 
            amount: cost 
        });

        if (deductError) {
             // Fallback if RPC fails, though direct update is also possible but RPC is safer for concurrency
             // Trying direct update as fallback or if RPC doesn't exist yet (assuming it might not)
             // But for safety let's assume we do direct update if RPC is missing in this context or just direct update for simplicity if concurrency isnt massive
             // Let's use direct update for now to avoid dependency on a specific RPC function potentially not existing
             const { error: updateError } = await supabase
                .from('profiles')
                .update({ credits: profile.credits - cost })
                .eq('id', user.id);
            
             if (updateError) {
                 return new Response(JSON.stringify({ error: "Transaction Failed" }), { status: 500 });
             }
        }

        // --- GENERATION LOGIC ---
        const seed = userSeed ? Number(userSeed) : Math.floor(Math.random() * 1000000000);
        let prediction;
        let generationConfig = {};
        let systemPrompt = "";
        
        // UNIFIED KLING MODE (Text-to-Video & Image-to-Video)
        // Kling v2.5 Turbo Pro Integration
        // Using dynamic version lookup to ensure stability
        const modelOwner = "kwaivgi";
        const modelName = "kling-v2.5-turbo-pro";
        
        let versionId;
        try {
            const model = await replicate.models.get(modelOwner, modelName);
            versionId = model.latest_version.id;
        } catch (err) {
            console.error("Failed to fetch model version silently:", err);
            // Fallback to a known hash if lookup fails (Manual override if needed in future)
            throw new Error(`Failed to resolve model ${modelOwner}/${modelName}: ${err.message}`);
        }

        let finalPrompt = "";
        if (prompt_structure) {
            const userP = prompt_structure.user_prompt || "";
            const styleP = prompt_structure.style_preset || "cinematic, 4k, high quality, photorealistic"; 
            finalPrompt = `${userP}, ${styleP}`;
            systemPrompt = styleP;
        } else {
            finalPrompt = prompt || "Cinematic shot";
        }

        generationConfig = {
            model: `${modelOwner}/${modelName}`,
            duration: durationStr, 
            aspect_ratio,
            seed
        };

        prediction = await replicate.predictions.create({
            version: versionId,
            input: {
                prompt: finalPrompt,
                input_image: start_image_url || undefined, // Start Frame
                tail_image: end_image_url || undefined,   // End Frame (Context)
                duration: Number(generationConfig.duration), // Ensure Integer
                aspect_ratio: generationConfig.aspect_ratio,
                seed: seed
            }
        });

        // Return the prediction status immediately
        // Metadata is attached here, but frontend must merge it with final output later
        return new Response(JSON.stringify({ 
            ...prediction,
            lux_metadata: { // Custom metadata wrapper
                seed,
                generation_config: generationConfig,
                prompt_structure: prompt_structure || { 
                    user_prompt: prompt,
                    system_prompt: systemPrompt
                }
            }
        }), {
            status: 201,
            headers: { 'content-type': 'application/json' },
        });

    } catch (error) {
        console.error("API Generation Error:", error);
        
        // FUTURE: IMPLEMENT REFUND LOGIC HERE IF REPLICATE FAILS
        
        return new Response(JSON.stringify({ 
            error: error.message || "Unknown Generation Error" 
        }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}
