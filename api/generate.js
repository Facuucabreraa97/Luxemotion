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

    try {
        const body = await request.json();
        const { 
            start_image_url, 
            end_image_url, 
            aspect_ratio = '9:16', // Default to Mobile-First (TikTok/Reels)
            motion_bucket_id = 127, // Default normal motion
            prompt_structure,
            prompt // Fallback for legacy calls
        } = body;

        // 1. SEED CONTROL: Generate locally if not provided
        // This ensures every generation has a traceable seed for Remixing
        const seed = body.seed ? Number(body.seed) : Math.floor(Math.random() * 1000000000);

        let output;
        let generationConfig = {};
        let systemPrompt = "";
        
        // --- LOGIC BRANCHING ---

        // A. DUAL IMAGE MODE (Morph/Interpolation)
        if (start_image_url && end_image_url) {
            generationConfig = {
                model: "google/frame-interpolation",
                times_to_interpolate: 4,
            };
            
            output = await replicate.run(
                "google/frame-interpolation:4f88a16a13673a8b589c18866e540556170a5bcb2ccdc12de556e800e9456d3d", // Correct hash
                {
                    input: {
                        frame1: start_image_url,
                        frame2: end_image_url,
                        times_to_interpolate: generationConfig.times_to_interpolate
                    }
                }
            );
        }
        
        // B. SINGLE IMAGE MODE (Motion / Image-to-Video)
        else if (start_image_url) {
            generationConfig = {
                model: "stability-ai/stable-video-diffusion",
                motion_bucket_id: Number(motion_bucket_id),
                seed: seed,
                fps: 24, // Smoother playback
                cond_aug: 0.02
            };

            output = await replicate.run(
                "stability-ai/stable-video-diffusion:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
                {
                    input: {
                        input_image: start_image_url,
                        video_length: "25_frames_with_svd_xt",
                        sizing_strategy: "maintain_aspect_ratio",
                        motion_bucket_id: generationConfig.motion_bucket_id,
                        frames_per_second: generationConfig.fps,
                        cond_aug: generationConfig.cond_aug,
                        seed: seed
                    }
                }
            );
        }
        
        // C. TEXT TO VIDEO MODE (The Remix Engine)
        else {
            // Handle Prompts
            let finalPrompt = "";
            
            if (prompt_structure) {
                // New Structured format
                const userP = prompt_structure.user_prompt || "";
                const styleP = prompt_structure.style_preset || "cinematic, 4k, high quality, photorealistic"; 
                finalPrompt = `${userP}, ${styleP}`;
                systemPrompt = styleP;
            } else {
                // Legacy Fallback
                finalPrompt = prompt + ", cinematic, 4k, photorealistic";
            }

            // Determine dimensions based on Mobile-First defaults
            let width = 576;
            let height = 1024;

            if (aspect_ratio === '16:9') {
                width = 1024;
                height = 576;
            } else if (aspect_ratio === '1:1') {
                width = 768;
                height = 768;
            }

            generationConfig = {
                model: "lucataco/animate-diff",
                width,
                height,
                seed,
                steps: 25,
                guidance_scale: 7.5
            };

            // Using AnimateDiff (Lightning/Fast version hash) 
            // Note: Hash for lucataco/animate-diff implementation
            output = await replicate.run(
                "lucataco/animate-diff:beecf59c4aee8d81bf04f0381033dfa10dc16e845b4ae00d281e2fa377e48a9f",
                {
                    input: {
                        prompt: finalPrompt,
                        n_prompt: "bad quality, worse quality, low resolution, blurry, distorted, deformed",
                        width: width,
                        height: height,
                        num_frames: 24, // Standard 2-3s clip
                        seed: seed,
                        steps: generationConfig.steps,
                        guidance_scale: generationConfig.guidance_scale
                    }
                }
            );
        }

        // --- SUCCESS RESPONSE ---
        return new Response(JSON.stringify({ 
            output,
            metadata: {
                seed: seed,
                generation_config: generationConfig,
                // Return structured prompt for DB storage
                prompt_structure: prompt_structure || { 
                    full_prompt: prompt,
                    system_prompt: systemPrompt 
                } 
            }
        }), {
            status: 200,
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
