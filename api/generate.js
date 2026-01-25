
// api/generate.js
import Replicate from 'replicate';

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
    });

    try {
        const { prompt, start_image_url } = await request.json();

        let output;

        if (start_image_url) {
            // Screen-to-Video / Image-to-Video
            // Using a high quality model for consistency
            output = await replicate.run(
                "stability-ai/stable-video-diffusion:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
                {
                    input: {
                        cond_aug: 0.02,
                        decoding_t: 7,
                        input_image: start_image_url,
                        video_length: "25_frames_with_svd_xt",
                        sizing_strategy: "maintain_aspect_ratio",
                        motion_bucket_id: 127,
                        frames_per_second: 10
                    }
                }
            );
        } else {
            // Text to Video
            // Injecting Hyper-Realism keywords
            const hyperRealismWrapper = ", Shot on ARRI Alexa Mini LF, Cooke S7/i lenses, 8k resolution, photorealistic, cinematic lighting, volumetric fog, high contrast, hyper-realistic, subsurface scattering, micro-details";

            output = await replicate.run(
                "anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
                {
                    input: {
                        prompt: prompt + hyperRealismWrapper,
                        num_frames: 24,
                        width: 1024,
                        height: 576
                    }
                }
            );
        }

        return new Response(JSON.stringify({ output }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}
