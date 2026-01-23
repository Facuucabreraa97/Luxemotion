import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import Replicate from 'replicate';

// Initialize Clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { mode, prompt, aspectRatio = '16:9', startImage } = req.body;

    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    try {
        // --- STEP 1: LUXURY PROMPT ENHANCEMENT ---
        let finalPrompt = prompt;
        if (process.env.OPENAI_API_KEY) {
            try {
                const enhancement = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo", // Cost efficient
                    messages: [
                        { role: "system", content: "You are a cinematic prompt engineer for a high-end luxury studio. Rewrite the user's prompt to be 8k, photorealistic, dramatic lighting, and trending on artstation. Keep it concise but premium." },
                        { role: "user", content: prompt }
                    ]
                });
                finalPrompt = enhancement.choices[0].message.content || prompt;
            } catch (e) {
                console.warn("OpenAI Enhancement Failed, using fallback.");
                finalPrompt = `Cinematic, 8k, highly detailed, dramatic lighting, luxury style, ${prompt}`;
            }
        } else {
            finalPrompt = `Cinematic, 8k, highly detailed, dramatic lighting, luxury style, ${prompt}`;
        }

        console.log("Processing Prompt:", finalPrompt);

        // --- STEP 2: ROUTING & GENERATION ---
        let output;

        if (mode === 'image') {
            // FLUX SCHNELL (Fast & High Quality)
            output = await replicate.run(
                "black-forest-labs/flux-schnell",
                {
                    input: {
                        prompt: finalPrompt,
                        aspect_ratio: aspectRatio,
                        num_outputs: 1
                    }
                }
            );
        } else if (mode === 'video') {
            if (startImage) {
                // IMG2VID (SVD)
                output = await replicate.run(
                    "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816f3af8d9f9496611f63451239572d6f46b6",
                    {
                        input: {
                            input_image: startImage,
                            video_length: "25_frames_with_svd_xt",
                            sizing_strategy: "maintain_aspect_ratio"
                        }
                    }
                );
            } else {
                // TEXT2VID (Minimax or Kling)
                // Using Minimax for high motion
                output = await replicate.run(
                    "minimax/video-01",
                    {
                        input: {
                            prompt: finalPrompt,
                            prompt_optimizer: true
                        }
                    }
                );
            }
        }

        // --- STEP 3: RESPONSE ---
        // Replicate returns array or string depending on model. Flux returns string[]. Video returns string (url).
        let outputUrl = Array.isArray(output) ? output[0] : output;

        // Handle stream object if needed (some models return streams), but usually .run waits.

        return res.status(200).json({ outputUrl, enhancedPrompt: finalPrompt });

    } catch (error: any) {
        console.error("Generation Error:", error);
        return res.status(500).json({ error: error.message || 'Internal Studio Error' });
    }
}
