// api/generate.js
import Replicate from 'replicate';

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    const token = process.env.REPLICATE_API_TOKEN;

    if (!token) {
        return new Response(JSON.stringify({ error: "Missing REPLICATE_API_TOKEN" }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }

    const replicate = new Replicate({ auth: token });
    const url = new URL(request.url);

    try {
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
            aspect_ratio = '9:16', 
            motion_bucket_id = 127,
            prompt_structure,
            prompt,
            seed: userSeed
        } = body;

        const seed = userSeed ? Number(userSeed) : Math.floor(Math.random() * 1000000000);
        let prediction;
        let generationConfig = {};
        let systemPrompt = "";
        
        // A. DUAL IMAGE MODE (Frame Interpolation)
        if (start_image_url && end_image_url) {
            generationConfig = {
                model: "google/frame-interpolation",
                times_to_interpolate: 4,
            };
            
            // Using predictions.create instead of run
            prediction = await replicate.predictions.create({
                version: "4f88a16a13673a8b589c18866e540556170a5bcb2ccdc12de556e800e9456d3d",
                input: {
                    frame1: start_image_url,
                    frame2: end_image_url,
                    times_to_interpolate: generationConfig.times_to_interpolate
                }
            });
        }
        
        // B. SINGLE IMAGE MODE (SVD)
        else if (start_image_url) {
            generationConfig = {
                model: "stability-ai/stable-video-diffusion",
                motion_bucket_id: Number(motion_bucket_id),
                seed: seed,
                fps: 24,
                cond_aug: 0.02
            };

            prediction = await replicate.predictions.create({
                version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
                input: {
                    input_image: start_image_url,
                    video_length: "25_frames_with_svd_xt",
                    sizing_strategy: "maintain_aspect_ratio",
                    motion_bucket_id: generationConfig.motion_bucket_id,
                    frames_per_second: generationConfig.fps,
                    cond_aug: generationConfig.cond_aug,
                    seed: seed
                }
            });
        }
        
        // C. TEXT TO VIDEO MODE (AnimateDiff)
        else {
            let finalPrompt = "";
            // systemPrompt is now handled in outer scope
            
            if (prompt_structure) {
                const userP = prompt_structure.user_prompt || "";
                const styleP = prompt_structure.style_preset || "cinematic, 4k, high quality, photorealistic"; 
                // ERROR 1 FIX: Ensure this is a string, not an object
                finalPrompt = `${userP}, ${styleP}`;
                systemPrompt = styleP;
            } else {
                finalPrompt = prompt + ", cinematic, 4k, photorealistic";
            }

            let width = 576;
            let height = 1024; // Default 9:16
            if (aspect_ratio === '16:9') { width = 1024; height = 576; }
            else if (aspect_ratio === '1:1') { width = 768; height = 768; }

            // ERROR 3 FIX: Increase Duration
            // AnimateDiff Lightning supports up to 32 frames? Standard is 16-24. 
            // Lowering FPS to 8 makes 24 frames last 3 seconds.
            generationConfig = {
                model: "lucataco/animate-diff",
                width, height, seed, steps: 25, guidance_scale: 7.5,
                num_frames: 24,
                fps: 8 
            };

            prediction = await replicate.predictions.create({
                version: "beecf59c4aee8d81bf04f0381033dfa10dc16e845b4ae00d281e2fa377e48a9f",
                input: {
                    prompt: finalPrompt, // Now guaranteed string
                    n_prompt: "bad quality, worse quality, low resolution, blurry, distorted, deformed",
                    width, height, 
                    num_frames: generationConfig.num_frames, 
                    seed,
                    steps: generationConfig.steps,
                    guidance_scale: generationConfig.guidance_scale
                }
            });
        }

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
        return new Response(JSON.stringify({ 
            error: error.message || "Unknown Generation Error" 
        }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}
