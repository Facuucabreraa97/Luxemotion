import express from 'express';
import cors from 'cors';
import Replicate from 'replicate';
import dotenv from 'dotenv';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import helmet from 'helmet';
import compression from 'compression';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Load .dotenv only in non-production environments
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
const port = process.env.PORT || 3001;

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only if the service key exists
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

const mpAccessToken = process.env.MP_ACCESS_TOKEN || 'TEST-TOKEN';
const client = new MercadoPagoConfig({ accessToken: mpAccessToken });

const replicateToken = process.env.REPLICATE_API_TOKEN;
const replicate = new Replicate({ auth: replicateToken });

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
app.use(cors({ origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] }));
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

    // 1. Calculate Costs
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
        action_type
    } = req.body;

    let cost = Number(duration) === 5 ? 10 : 20;
    if (mode === 'velvet') cost += 10; // Velvet Premium

    // 2. Verify Balance
    const { data: profile } = await supabaseAdmin.from('profiles').select('credits, is_admin').eq('id', user.id).single();
    if (!profile) throw new Error("Profile not found");

    const isAdmin = profile.is_admin === true;

    if (!isAdmin && profile.credits < cost) {
      throw new Error(`Insufficient credits (${profile?.credits}cr). Needed ${cost}cr.`);
    }

    // 3. Deduct Credits (if not admin)
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
            const visionOutput = await analyzeProductImage(product_image_url);
            console.log(`👁️ Vision Output: "${visionOutput}"`);

            // Map action_type to phrase
            const action = action_type || 'holding';
            const actionMap = {
                'holding': `holding ${visionOutput}`,
                'drinking': `drinking from ${visionOutput}`,
                'using': `using ${visionOutput}`,
                'wearing': `wearing ${visionOutput}`
            };

            // Default to 'holding' + output if key not found
            const actionPhrase = actionMap[action] || `holding ${visionOutput}`;

            // Inject into prompt
            // "Subject description, [actionPhrase], style..."
            // Remove trailing period from base prompt if present
            if (effectivePrompt.endsWith('.')) effectivePrompt = effectivePrompt.slice(0, -1);

            effectivePrompt = `${effectivePrompt}, ${actionPhrase}`;

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
        if (image) inputPayload.start_image = image;
    } else {
        inputPayload.start_image = image;
        if (endImage) inputPayload.tail_image = endImage;
    }

    console.log(`🎬 Generating ${mode?.toUpperCase() || 'STD'} for ${user.email} | Prompt: ${finalPrompt.substring(0, 50)}...`);
    const output = await replicate.run("kwaivgi/kling-v2.5-turbo-pro", { input: inputPayload });
    const remoteUrl = Array.isArray(output) ? output[0] : output;

    // 5. Upload to Storage
    const videoRes = await fetch(remoteUrl);
    const videoBlob = await videoRes.arrayBuffer();
    const fileName = `luxe_${user.id}_${Date.now()}.mp4`;

    const { error: uploadError } = await supabaseAdmin.storage
        .from('videos')
        .upload(fileName, videoBlob, { contentType: 'video/mp4' });

    if (uploadError) throw new Error("Error uploading to cloud: " + uploadError.message);

    const { data: { publicUrl } } = supabaseAdmin.storage.from('videos').getPublicUrl(fileName);

    // 6. Save Record
    await supabaseAdmin.from('generations').insert({
        user_id: user.id,
        video_url: publicUrl,
        prompt: finalPrompt, // Save the actual used prompt
        aspect_ratio: aspectRatio,
        cost: cost
    });

    res.json({ videoUrl: publicUrl, cost, remainingCredits: isAdmin ? profile.credits : profile.credits - cost });

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
  console.log("💰 PURCHASE INTENT - Payload received:", req.body);
  console.log("HEADERS:", req.headers['content-type']);
  console.log("BODY RAW:", req.body);

  console.log("🔑 CHECK ADMIN KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "LOADED (Ends in: " + process.env.SUPABASE_SERVICE_ROLE_KEY.slice(-5) + ")" : "NOT LOADED");

  try {
    // Robust User Extraction (Priority: Body > Token)
    let buyerId = req.body.userId || req.body.buyerId || req.body.user_id;

    if (!buyerId) {
        console.error("❌ EMPTY BODY OR MISSING ID. Received:", req.body);
        return res.status(400).json({ error: "Invalid User: ID is missing in request body", received: req.body });
    }

    // Existence Verification
    console.log(`🔍 Verifying user ${buyerId} in 'profiles' table...`);
    const { data: userProfile, error: userError } = await supabaseAdmin
        .from('profiles') // <--- KEY: Use the real table
        .select('id, credits, email')
        .eq('id', buyerId)
        .single();

    if (userError || !userProfile) {
         console.error("❌ Error searching for profile:", userError);
         throw new Error("Invalid User: User not found in database (Check table name 'profiles')");
    }

    console.log(`✅ Valid Buyer: ${userProfile.email} | Credits: ${userProfile.credits}`);

    const talent_id = req.body.talent_id || req.body.assetId;
    if (!talent_id) throw new Error("Talent ID (assetId) required");

    // Attempt Atomic RPC Call
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('buy_talent', {
        p_talent_id: talent_id,
        p_buyer_id: buyerId
    });

    if (rpcError) {
        // Log detailed error for debugging
        console.error("RPC Error:", rpcError);
        throw new Error("Transaction failed. Please contact support.");
    }

    if (!result) {
        throw new Error("No response from transaction processor.");
    }

    if (!result.success) {
        throw new Error(result.message || "Purchase failed");
    }

    res.json(result);

  } catch (error) {
    console.error("Purchase Error:", error.message);
    res.status(500).json({ error: error.message, code: 'TRANSACTION_FAILED' });
  }
});

// Alias for compatibility
app.post('/api/marketplace/buy', async (req, res) => {
    try {
        const user = await getUser(req);
        const { talent_id } = req.body;
        if (!talent_id) throw new Error("Talent ID required");

        const { data: result, error: rpcError } = await supabaseAdmin.rpc('buy_talent', {
            p_talent_id: talent_id,
            p_buyer_id: user.id
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
    const { video_id, id, type } = req.body;
    const targetId = video_id || id;
    const table = (type === 'model' || type === 'talent') ? 'talents' : 'generations';

    if (!targetId) throw new Error("ID missing");

    const { data: item } = await supabaseAdmin.from(table).select('user_id, is_public').eq('id', targetId).single();
    if (!item || item.user_id !== user.id) throw new Error("Permission denied");

    const newStatus = !item.is_public;
    const updateData = { is_public: newStatus };
    if (newStatus) updateData.created_at = new Date().toISOString();

    const { error } = await supabaseAdmin.from(table).update(updateData).eq('id', targetId);
    if (error) throw error;

    res.json({ success: true, is_public: newStatus });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message, stack: error.stack });
  }
});

app.listen(port, () => console.log(`🛡️  LUXEMOTION SENIOR SERVER RUNNING ON PORT ${port}`));
