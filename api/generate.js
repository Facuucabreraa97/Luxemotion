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
            aspect_ratio = '16:9', 
            prompt_structure,
            prompt,
            duration = "5", // Default to 5s
            seed: userSeed
        } = body;

        const seed = userSeed ? Number(userSeed) : Math.floor(Math.random() * 1000000000);
        let prediction;
        let generationConfig = {};
        let systemPrompt = "";
        
        // A. DUAL IMAGE MODE (Frame Interpolation - Legacy Support)
        if (start_image_url && end_image_url) {
            generationConfig = {
                model: "google/frame-interpolation",
                times_to_interpolate: 4,
            };
            
            prediction = await replicate.predictions.create({
                version: "4f88a16a13673a8b589c18866e540556170a5bcb2ccdc12de556e800e9456d3d",
                input: {
                    frame1: start_image_url,
                    frame2: end_image_url,
                    times_to_interpolate: generationConfig.times_to_interpolate
                }
            });
        }
        
        // B. UNIFIED KLING MODE (Text-to-Video & Image-to-Video)
        else {
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
                duration: String(duration), // Ensure string "5" or "10"
                aspect_ratio,
                seed
            };

            prediction = await replicate.predictions.create({
                version: versionId,
                input: {
                    prompt: finalPrompt,
                    input_image: start_image_url || undefined, // Optional for I2V
                    duration: generationConfig.duration,
                    aspect_ratio: generationConfig.aspect_ratio,
                    seed: seed
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
