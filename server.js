import express from 'express';
import cors from 'cors';
import Replicate from 'replicate';
import dotenv from 'dotenv';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import helmet from 'helmet';
import compression from 'compression';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import axios from 'axios';

// Load .dotenv only in non-production environments
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

console.log("--- DEBUGGING ENV VARS ---");
console.log("SUPABASE_URL detected:", process.env.SUPABASE_URL ? "YES (Hidden value)" : "NO (Undefined)");
console.log("SUPABASE_SERVICE_ROLE_KEY detected:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "YES (Hidden value)" : "NO (Undefined)");
console.log("SUPABASE_KEY detected:", process.env.SUPABASE_KEY ? "YES (Hidden value)" : "NO (Undefined)");
console.log("--------------------------");

const app = express();

// MOVE THIS TO THE BEGINNING OF THE FILE (After imports)
app.use(cors({
origin: true,
credentials: true,
methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.options(/.*/, cors()); // Enable pre-flight for EVERYTHING

const port = process.env.PORT || 3001;

// --- CONFIGURATION ---
const sbUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!sbUrl || !sbKey) {
  throw new Error("FATAL: Supabase credentials are not being read from the environment.");
}

// Initialize with the confirmed variables
const supabaseAdmin = createClient(sbUrl, sbKey);

const mpAccessToken = process.env.MP_ACCESS_TOKEN || 'TEST-TOKEN';
const client = new MercadoPagoConfig({ accessToken: mpAccessToken });

const replicateToken = process.env.REPLICATE_API_TOKEN;
const replicate = new Replicate({ auth: replicateToken });

const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

// Safety Check for OpenAI
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.warn("⚠️ CRITICAL: OPENAI_API_KEY missing in Environment Variables. AI Vision features will be disabled.");
}

// --- CACHE ---
let exchangeRateCache = {
  rate: null,
  timestamp: 0
};

const CACHE_DURATION = 3600 * 1000; // 1 hour

async function getUsdToArsRate() {
  const now = Date.now();
  if (exchangeRateCache.rate && (now - exchangeRateCache.timestamp < CACHE_DURATION)) {
    return exchangeRateCache.rate;
  }

  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!response.ok) throw new Error('Failed to fetch rates');
    const data = await response.json();
    const rate = data.rates.ARS;
    if (rate) {
      exchangeRateCache = {
        rate: rate,
        timestamp: now
      };
      return rate;
    }
  } catch (error) {
    console.error("⚠️ Error fetching exchange rate:", error.message);
  }

  return exchangeRateCache.rate || 1200; // Fallback to safe default
}

// --- MIDDLEWARE ---
app.use(helmet());
app.use(compression());

app.use(express.json({ limit: '50mb' }));

// --- UTILS ---
const getUser = async (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error("Missing Token");
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error("Invalid User");
    return user;
};

const analyzeProductImage = async (imageUrl) => {
    if (!openai) {
        throw new Error("OpenAI client is not initialized (Missing API Key)");
    }
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a visual analysis AI. Output ONLY a short, concise visual description of the main object in the image (e.g., 'a red soda can', 'a black leather handbag'). Do not use full sentences. Do not describe the background."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze this product image." },
                        { type: "image_url", image_url: { url: imageUrl } },
                    ],
                },
            ],
            max_tokens: 50,
        });
        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error("Vision Analysis Failed:", error.message);
        throw error; // Propagate to let the caller handle the fallback
    }
};

// --- API GENERATE VIDEO (VELVET ENGINE) ---
app.post('/api/generate', async (req, res) => {
  try {
    const user = await getUser(req);

    if (!replicateToken) throw new Error("Missing Replicate API Token");

    // 1. Calculate Costs (Modified for LuxeVoice)
    const {
        duration,
        mode,
        prompt,
        aspectRatio,
        image,
        inputVideo,
        endImage,
        velvetStyle,
        product_image_url,
        action_type,
        voiceScript, // Phase 2 Trigger
        voiceId
    } = req.body;

    // Default base cost (5 for standard)
    // If voiceScript is present, cost jumps to 25.
    let cost = 5;
    if (voiceScript && voiceScript.length > 0) {
        cost = 25;
    }

    if (mode === 'velvet') cost += 10; // Velvet Premium surcharge stacks

    // 2. Verify Balance
    const { data: profile } = await supabaseAdmin.from('profiles').select('credits, is_admin').eq('id', user.id).single();
    if (!profile) throw new Error("Profile not found");

    const isAdmin = profile.is_admin === true;

    if (!isAdmin && profile.credits < cost) {
      throw new Error(`Insufficient credits (${profile?.credits}cr). Needed ${cost}cr.`);
    }

    // 3. Deduct Credits (if not admin)
    // We deduct FULL amount upfront to prevent fraud. We refund if Phase 2 fails.
    if (!isAdmin) {
      const { error: deductError } = await supabaseAdmin.from('profiles').update({ credits: profile.credits - cost }).eq('id', user.id);
      if (deductError) throw new Error("Error updating balance");
    }

    // 4. Prompt Engineering (Vision & Logic)
    let effectivePrompt = prompt || "Beautiful subject";

    // --- VISION MIDDLEWARE START ---
    if (product_image_url) {
        console.log(`👁️ Vision Middleware Active for ${user.email}`);
        try {
            // Check if product image exists and inject specific prompt
            // "Professional cinematic product shot. A fashion model interacting naturally with a [product/bottle/item]. The product is clearly visible, in focus, and elegantly displayed."

            // We still analyze the image to know WHAT it is (bottle, bag, etc.)
            const visionOutput = await analyzeProductImage(product_image_url);
            console.log(`👁️ Vision Output: "${visionOutput}"`);

            // Inject into prompt (Enhanced Logic)
            effectivePrompt = `Professional cinematic product shot. A fashion model interacting naturally with a ${visionOutput}. The product is clearly visible, in focus, and elegantly displayed. ${effectivePrompt}`;

        } catch (visionError) {
            console.warn("⚠️ Vision Middleware failed, falling back to original prompt.", visionError.message);
            // Fallback: Proceed with effectivePrompt as is (original prompt)
        }
    }
    // --- VISION MIDDLEWARE END ---

    let stylePrompt = "";
    if (mode === 'velvet') {
        const skinOptimizer = ", (skin texture:1.4), (visible pores:1.3)";
        switch (velvetStyle) {
            case 'boudoir':
                stylePrompt = ", hyperrealistic anime adaptation, unreal proportions but realistic skin texture, subsurface scattering, fantasy lingerie, neon ambient light";
                break;
            case 'cosplay':
                stylePrompt = ", bedroom cosplay, (fabric texture:1.3), (stitching details:1.2), realistic latex reflection";
                break;
            default: // leaked
                 stylePrompt = ", (camera noise:1.2), (motion blur:1.1), flash photography, poor lighting, authentic look, authentic amateur vibe";
        }
        stylePrompt += skinOptimizer;
    } else {
        stylePrompt = ", cinematic lighting, commercial grade, sharp focus, masterpiece, shot on ARRI Alexa, color graded, professional studio, vogue magazine style, 4k, clean composition";
    }

    const finalPrompt = effectivePrompt + stylePrompt;

    const negativePrompt = mode === 'velvet'
        ? "censor bars, mosaic, blur, cartoonish skin, airbrushed, plastic look, 3d render, plastic, doll, smooth skin, cartoon, illustration, symmetry, cgi, drawing, doll-like, deformed, ugly, watermark, text, low quality, distortion, bad anatomy, extra limbs"
        : "cartoon, drawing, illustration, plastic skin, doll-like, deformed, ugly, blur, watermark, text, low quality, distortion, bad anatomy, extra limbs, cgi, 3d render";

    const inputPayload = {
      prompt: finalPrompt,
      aspect_ratio: aspectRatio || "9:16",
      duration: Number(duration),
      cfg_scale: mode === 'velvet' ? 0.45 : 0.6,
      negative_prompt: negativePrompt
    };

    if (inputVideo) {
        inputPayload.video = inputVideo;
        // Prioritize product image as start_image if available (Remix Mode Fix)
        if (product_image_url) {
            inputPayload.start_image = product_image_url;
        } else if (image) {
            inputPayload.start_image = image;
        }
    } else {
        // Prioritize product image as start_image if available
        if (product_image_url) {
            inputPayload.start_image = product_image_url;
        } else {
            inputPayload.start_image = image;
        }
        if (endImage) inputPayload.tail_image = endImage;
    }

    console.log(`🎬 Generating ${mode?.toUpperCase() || 'STD'} for ${user.email} | Prompt: ${finalPrompt.substring(0, 50)}...`);

    // PHASE 1: Base Video Generation
    const output = await replicate.run("kwaivgi/kling-v2.5-turbo-pro", { input: inputPayload });
    const remoteUrl = Array.isArray(output) ? output[0] : output;

    let finalVideoUrl = remoteUrl;
    let voiceSuccess = false;
    let voiceWarning = false;

    // PHASE 2: Voice Layer (Conditional)
    if (voiceScript && voiceId) {
        console.log(`🎤 Voice Mode Active: Script "${voiceScript.substring(0, 20)}..." | Voice: ${voiceId}`);
        try {
            if (!elevenLabsApiKey) throw new Error("ElevenLabs API Key missing");

            // Step A: TTS (ElevenLabs)
            const ttsResponse = await axios.post(
                `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
                {
                    text: voiceScript,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: { stability: 0.5, similarity_boost: 0.5 }
                },
                {
                    headers: {
                        'xi-api-key': elevenLabsApiKey,
                        'Content-Type': 'application/json',
                        'Accept': 'audio/mpeg'
                    },
                    responseType: 'arraybuffer'
                }
            );

            // Step B: Upload Audio to Storage
            const audioBuffer = ttsResponse.data;
            const audioFileName = `audio-temp/${user.id}-${Date.now()}.mp3`;
            const { error: audioUploadError } = await supabaseAdmin.storage
                .from('assets') // Using 'assets' bucket as requested
                .upload(audioFileName, audioBuffer, { contentType: 'audio/mpeg' });

            if (audioUploadError) throw new Error("Audio upload failed: " + audioUploadError.message);

            const { data: { publicUrl: audioUrl } } = supabaseAdmin.storage
                .from('assets')
                .getPublicUrl(audioFileName);

            console.log("🔊 Audio uploaded:", audioUrl);

            // Step C: Lip-Sync (Replicate)
            // Using cjwbw/video-retalking
            const syncOutput = await replicate.run(
                "cjwbw/video-retalking:db5a63d14300880584749699479a42ca0f55b1f486d9a9f24e4c9e782e5d9780",
                {
                    input: {
                        face: remoteUrl, // Result from Phase 1
                        input_audio: audioUrl
                    }
                }
            );

            finalVideoUrl = Array.isArray(syncOutput) ? syncOutput[0] : syncOutput;
            voiceSuccess = true;
            console.log("🗣️ LipSync Complete:", finalVideoUrl);

        } catch (voiceError) {
            console.error("⚠️ Voice Layer Failed (Soft-Fail Active):", voiceError.message);
            voiceWarning = true;

            // Revert to original video if voice failed
            finalVideoUrl = remoteUrl;

            // Refund the extra cost (20 credits) - Wrapped to prevent crash
            if (!isAdmin) {
                try {
                    await supabaseAdmin.from('profiles').update({ credits: profile.credits - 5 }).eq('id', user.id); // Refund 20, keeping 5 base
                    cost = 5; // Update cost variable for record keeping
                    console.log("♻️ Credits refunded due to voice failure.");
                } catch (refundError) {
                    console.error("⚠️ Refund failed:", refundError.message);
                }
            }
        }
    }

    console.log("💾 Proceeding to save generation...");

    // 5. Upload Final Result to Storage
    const videoRes = await fetch(finalVideoUrl);
    const videoBlob = await videoRes.arrayBuffer();
    const fileName = `luxe_${user.id}_${Date.now()}.mp4`;

    const { error: uploadError } = await supabaseAdmin.storage
        .from('videos')
        .upload(fileName, videoBlob, { contentType: 'video/mp4' });

    if (uploadError) throw new Error("Error uploading to cloud: " + uploadError.message);

    const { data: { publicUrl } } = supabaseAdmin.storage.from('videos').getPublicUrl(fileName);

    // 6. Save Record
    const { data: genRecord, error: insertError } = await supabaseAdmin.from('generations').insert({
        user_id: user.id,
        video_url: publicUrl,
        prompt: finalPrompt, // Save the actual used prompt
        aspect_ratio: aspectRatio,
        cost: cost
    }).select('id').single();

    if (insertError) {
        console.error("❌ DB Insert Failed:", insertError.message);
        // We do not throw here to allow the user to at least see the generated video
    } else {
        console.log("✅ Generation saved to DB:", genRecord.id);
    }

    res.json({
        id: genRecord ? genRecord.id : null,
        videoUrl: publicUrl,
        cost,
        remainingCredits: isAdmin ? profile.credits : (voiceWarning ? profile.credits - 5 : profile.credits - cost),
        voiceWarning
    });

  } catch (error) {
    console.error("❌ Generation Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- API PAYMENTS (Mercado Pago) ---
app.post('/api/create-preference', async (req, res) => {
  try {
    const { title, price, quantity, currency } = req.body;

    let finalPrice = price;
    if (currency !== 'ARS') {
      const rate = await getUsdToArsRate();
      finalPrice = price * rate;
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [{ title, unit_price: Number(finalPrice), quantity: Number(quantity), currency_id: 'ARS' }],
        back_urls: { success: `${clientUrl}/app/billing?status=success`, failure: `${clientUrl}/app/billing?status=failure` },
        auto_return: "approved",
      }
    });
    res.json({ url: result.init_point, id: result.id });
  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ error: "Payment initiation failed" });
  }
});

// --- API BUY (ATOMIC TRANSACTION) ---
app.post('/api/buy', async (req, res) => {
    try {
    console.log("--> Starting purchase:", req.body); // LOG FOR DEBUG

    // Support aliases for backward compatibility and destructure robustly
    const assetId = req.body.assetId || req.body.talent_id;
    const buyerId = req.body.buyerId || req.body.userId || req.body.user_id;
    const cost = req.body.cost;

    // CRITICAL CHECK: Does 'supabase' or 'supabaseAdmin' exist?
    // Make sure you use the correct instance you have initialized above
    if (!supabaseAdmin) throw new Error("Supabase client not initialized");

    const { data, error } = await supabaseAdmin.rpc('purchase_asset', {
    p_asset_id: assetId,
    p_buyer_id: buyerId,
    p_cost: cost
    });

    if (error) {
    console.error("Supabase RPC error:", error);
    return res.status(400).json({ success: false, message: error.message });
    }

    console.log("Purchase result:", data);

    // If the DB says logical error (insufficient balance, etc.)
    if (!data.success) {
    return res.status(400).json(data);
    }

    return res.status(200).json(data);

    } catch (err) {
    console.error("CRITICAL CRASH AT /api/buy:", err);
    // IMPORTANT: Return JSON even in crash to avoid CORS error due to timeout
    res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
});

// Alias for compatibility
app.post('/api/marketplace/buy', async (req, res) => {
    try {
        const user = await getUser(req);
        const { talent_id, cost } = req.body;
        if (!talent_id) throw new Error("Talent ID required");
        // For compatibility, if cost is missing, we might fail or default to 0. But let's assume it should be provided now.
        if (cost === undefined || cost === null) throw new Error("Cost is required");

        const { data: result, error: rpcError } = await supabaseAdmin.rpc('purchase_asset', {
            p_asset_id: talent_id,
            p_buyer_id: user.id,
            p_cost: cost
        });

        if (rpcError) throw new Error("Transaction failed at database level");
        if (!result.success) throw new Error(result.message || "Purchase failed");

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// --- API PUBLISH ---
app.post('/api/publish', async (req, res) => {
  try {
    if (!supabaseAdmin) throw new Error("ADMIN configuration is missing on the server.");

    const user = await getUser(req);
    // Support 'public' field for explicit setting, defaulting to toggle if undefined
    const { video_id, id, type, public: publicState } = req.body;
    const targetId = video_id || id;
    const table = (type === 'model' || type === 'talent') ? 'talents' : 'generations';

    if (!targetId) throw new Error("ID missing");

    const { data: item } = await supabaseAdmin.from(table).select('user_id, is_public').eq('id', targetId).single();
    if (!item || item.user_id !== user.id) throw new Error("Permission denied");

    // Determine new status: use explicit state if provided (checking strictly for boolean), else toggle
    let newStatus;
    if (typeof publicState === 'boolean') {
        newStatus = publicState;
    } else {
        newStatus = !item.is_public;
    }

    const updateData = { is_public: newStatus };
    // Only update created_at when publishing (switching to true)
    if (newStatus && !item.is_public) {
        updateData.created_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin.from(table).update(updateData).eq('id', targetId);
    if (error) throw error;

    res.json({ success: true, is_public: newStatus });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

app.listen(port, () => console.log(`🛡️  LUXEMOTION SENIOR SERVER RUNNING ON PORT ${port}`));
