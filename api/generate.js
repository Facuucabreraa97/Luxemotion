
// api/generate.js
import Replicate from 'replicate';

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    const token = process.env.REPLICATE_API_TOKEN;

    if (!token) {
        return new Response(JSON.stringify({ error: "Missing REPLICATE_API_TOKEN in Config. Please add it to Vercel Environment Variables." }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }

    const replicate = new Replicate({
        auth: token,
    });

    try {
        const { prompt, start_image_url, end_image_url, aspect_ratio } = await request.json();

        let output;

        // 1. DUAL IMAGE MODE (Morph/Interpolation)
        if (start_image_url && end_image_url) {
            output = await replicate.run(
                "google/frame-interpolation:4f88a16a13673a8b589c18866e540556170a5afe2f1173dbb969f63f5ac40174",
                {
                    input: {
                        frame1: start_image_url,
                        frame2: end_image_url,
                        times_to_interpolate: 4 // Creates smooth transition
                    }
                }
            );
        }
        // 2. SINGLE IMAGE MODE (Motion)
        else if (start_image_url) {
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
        }
        // 3. TEXT TO VIDEO MODE
        else {
            // Text to Video
            // Injecting Hyper-Realism keywords
            const hyperRealismWrapper = ", Shot on ARRI Alexa Mini LF, Cooke S7/i lenses, 8k resolution, photorealistic, cinematic lighting, volumetric fog, high contrast, hyper-realistic, subsurface scattering, micro-details";

            // Determine dimensions based on aspect ratio
            let width = 1024;
            let height = 576;

            if (aspect_ratio === '9:16') {
                width = 576;
                height = 1024;
            } else if (aspect_ratio === '1:1') {
                width = 768;
                height = 768;
            }

            output = await replicate.run(
                "anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
                {
                    input: {
                        prompt: prompt + hyperRealismWrapper,
                        num_frames: 24,
                        width: width,
                        height: height
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
