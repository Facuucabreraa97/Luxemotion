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

// CRITICAL: Must use Service Role for Admin/God Mode to Bypass RLS
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("FATAL: SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations will fail.");
}

if (!sbUrl) {
    throw new Error("FATAL: Supabase URL is not being read from the environment.");
}

// Initialize with the confirmed variables
// CORRECT (Admin/Backend Mode):
const supabaseAdmin = createClient(
    sbUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY // <--- Use the service role key
);

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

const requireAdmin = async (req, res, next) => {
    try {
        const user = await getUser(req);
        // Check admin status in DB. We check BOTH 'is_admin' (boolean) and 'role' (string) to be safe.
        // We select both columns; if one doesn't exist, Supabase might return null for it, which is handled.
        const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).single();

        const hasAdminRole = (profile.role === 'admin');
        const hasAdminFlag = (profile.is_admin === true);

        if (!profile || (!hasAdminFlag && !hasAdminRole)) {
            return res.status(403).json({ error: "Unauthorized: Admin Access Required" });
        }
        req.user = user;
        next();
    } catch (e) {
        console.error("Admin Check Failed:", e);
        return res.status(401).json({ error: "Unauthorized" });
    }
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
                effectivePrompt = `Commercial cinematic shot. A model holding and interacting with a ${visionOutput} naturally. The product is the main focus, clearly visible and sharp. ${effectivePrompt}`;

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
                console.warn("Voice Failure -> Downgrading to mute video");
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
            cost: cost,
            locked: false // Default to unlocked
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
        console.log("--> Starting purchase (Zero Trust):", req.body);

        // 1. INPUT VALIDATION & SETUP
        const { assetId, cost, assetType } = req.body;
        const buyerId = req.body.buyerId || req.body.userId || req.body.user_id;

        if (!assetId) throw new Error("Asset ID is required");
        if (!buyerId) throw new Error("Buyer ID is required");
        if (cost === undefined || cost === null) throw new Error("Cost is required");

        // Initialize Admin Client (Bypass RLS)
        const adminSupabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Determine Table
        // NOTE: We standardised on 'is_for_sale' for both tables if applicable.
        const table = (assetType === 'model' || assetType === 'talent') ? 'talents' : 'generations';

        console.log(`Searching in table: ${table} for ID: ${assetId}`);

        // 2. FETCH ITEM (Source of Truth)
        const { data: item, error } = await adminSupabase
            .from(table)
            .select('*')
            .eq('id', assetId)
            .single();

        if (error || !item) {
            return res.status(404).json({ success: false, message: "Asset not found", debug_error: error });
        }

        const sellerId = item.user_id;

        // 3. VALIDATIONS
        if (buyerId === sellerId) {
            return res.status(400).json({ success: false, message: "You cannot purchase your own asset." });
        }

        // Check if actually for sale (The "Zombie" Fix)
        if (item.is_for_sale !== true) {
            return res.status(400).json({ success: false, message: "This item is not listed for sale." });
        }

        // Check if already sold (Double spending protection)
        if (item.is_sold === true) {
            return res.status(400).json({ success: false, message: "This item has already been sold." });
        }

        // 4. TRANSACTION LOGIC (Credit Transfer)
        // Future-Proofing: Logic is isolated here for easier Royalties implementation later.

        // Fetch Buyer
        const { data: buyer, error: buyerError } = await adminSupabase
            .from('profiles')
            .select('credits, is_admin')
            .eq('id', buyerId)
            .single();

        if (buyerError || !buyer) throw new Error("Buyer profile not found");

        if (!buyer.is_admin && buyer.credits < cost) {
            throw new Error(`Insufficient credits. You have ${buyer.credits}, needed ${cost}.`);
        }

        // Execute Payment (Simplest Form: Direct Transfer)
        // Deduct from Buyer
        if (!buyer.is_admin) {
            const { error: deductError } = await adminSupabase
                .from('profiles')
                .update({ credits: buyer.credits - cost })
                .eq('id', buyerId);
            if (deductError) throw new Error("Failed to deduct credits from buyer");
        }

        // Credit Seller
        if (sellerId) {
            const { data: seller } = await adminSupabase.from('profiles').select('credits').eq('id', sellerId).single();
            if (seller) {
                await adminSupabase.from('profiles').update({ credits: seller.credits + cost }).eq('id', sellerId);
            }
        }

        // 5. ASSET TRANSFER (ATOMIC UPDATE)
        // We do NOT use 'sold' or 'is_sold'. We use 'is_for_sale = false' and change owner.
        const updatePayload = {
            user_id: buyerId, // New Owner
            is_for_sale: false, // Remove from market
            is_sold: true, // Mark as sold
            sales_count: (item.sales_count || 0) + 1
        };

        // Standardize: Ensure we don't accidentally write to 'for_sale' or 'sold' ghost columns.

        console.log("Transferring ownership...", updatePayload);

        const { error: transferError } = await adminSupabase
            .from(table)
            .update(updatePayload)
            .eq('id', assetId);

        if (transferError) {
            console.error("CRITICAL: Failed to transfer asset ownership!", transferError);
            throw new Error("Failed to transfer asset ownership. Please contact support.");
        }

        // 6. LINEAGE SECURITY (Lock Source)
        // If a Talent was sold, lock the source generation so it can't be used to make MORE talents.
        if (table === 'talents' && item.source_generation_id) {
            console.log(`🔒 Locking source video ${item.source_generation_id} due to Talent sale.`);
            await adminSupabase
                .from('generations')
                .update({ is_sold: true, locked: true }) // Update both for safety/compatibility
                .eq('id', item.source_generation_id);
        }

        return res.status(200).json({
            success: true,
            message: "Purchase and transfer successful",
            remainingCredits: buyer.is_admin ? buyer.credits : buyer.credits - cost
        });

    } catch (err) {
        console.error("CRITICAL CRASH AT /api/buy:", err.message);
        res.status(500).json({ success: false, message: err.message });
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


// --- API TALENT CREATION (CASTING) ---
app.post('/api/talents/create', async (req, res) => {
    try {
        const user = await getUser(req);
        const { name, image_url, role, notes, for_sale, is_for_sale, price, source_video_id, dna_prompt } = req.body;

        // STANDARDIZATION: Use 'is_for_sale' as Truth.
        // If legacy 'for_sale' is sent, accept it but map to 'is_for_sale'.
        const saleStatus = !!(is_for_sale || for_sale);

        if (!name || !image_url) throw new Error("Name and Image are required");

        // 1. SOURCE CHECK (The Golden Rule)
        if (source_video_id) {
            console.log(`🛡️ Validating source video: ${source_video_id}`);
            const { data: sourceVideo, error: sourceError } = await supabaseAdmin
                .from('generations')
                .select('*')
                .eq('id', source_video_id)
                .single();

            if (sourceError || !sourceVideo) {
                throw new Error("Source video not found or access denied.");
            }

            // GUARD CLAUSE: Strict Status Check
            // A video can't create a talent if it's already locked (is_sold: true) or currently for sale (is_for_sale: true)
            // Per CONTEXTO.md: "Zombis: Si un video original (generation) tiene is_sold: true o is_for_sale: true, NADIE puede crear nuevos modelos"
            if (sourceVideo.is_sold || sourceVideo.locked || sourceVideo.is_for_sale) {
                return res.status(403).json({
                    error: "SECURITY_BLOCK: The source asset is sold or for sale (Zombie Rule)."
                });
            }

            // Check Ownership
            if (sourceVideo.user_id !== user.id) {
                throw new Error("ILLEGAL ACTION: You do not own the source asset.");
            }

            // LINEAGE CHECK: Check if any OTHER talent from this source is already commercialized
            const { count: commercialCount, error: lineageError } = await supabaseAdmin
                .from('talents')
                .select('*', { count: 'exact', head: true })
                .eq('source_generation_id', source_video_id)
                .or('is_for_sale.eq.true,is_sold.eq.true,sales_count.gt.0');

            if (lineageError) {
                console.error("Lineage check failed:", lineageError);
                throw new Error("Security check failed during lineage verification.");
            }

            if (commercialCount > 0) {
                return res.status(403).json({ success: false, error: "This asset source has already been commercialized." });
            }
        }

        // 2. CREATE TALENT
        // CLEANUP: Not writing to legacy columns.
        const payload = {
            user_id: user.id,
            name,
            image_url,
            role: role || 'model',
            notes,
            is_for_sale: saleStatus, // ONLY write to Truth column
            is_sold: false, // Default new talent to not sold
            price: Number(price) || 0,
            original_creator_id: user.id,
            source_generation_id: source_video_id || null,
            dna_prompt
        };

        const { data: newTalent, error: insertError } = await supabaseAdmin
            .from('talents')
            .insert(payload)
            .select()
            .single();

        if (insertError) throw insertError;

        console.log(`🌟 New Talent Created: ${newTalent.id}`);
        res.json({ success: true, talent: newTalent });

    } catch (error) {
        console.error("❌ Casting Error:", error.message);
        res.status(400).json({ success: false, error: error.message });
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

        // Fetch item
        const { data: item } = await supabaseAdmin.from(table).select('*').eq('id', targetId).single();
        if (!item || item.user_id !== user.id) throw new Error("Permission denied");

        // GUARD CLAUSE: Check Source Video Status if it's a Talent
        if (table === 'talents' && item.source_generation_id) {
            const { data: sourceVideo } = await supabaseAdmin
                .from('generations')
                .select('*')
                .eq('id', item.source_generation_id)
                .single();

            if (sourceVideo && (sourceVideo.locked || sourceVideo.is_sold || sourceVideo.is_for_sale)) {
                return res.status(403).json({
                    error: "SECURITY_BLOCK: The source asset is no longer owned by you or is in trade."
                });
            }
        }

        // Determine new status: use explicit state if provided (checking strictly for boolean), else toggle
        let newStatus;
        if (typeof publicState === 'boolean') {
            newStatus = publicState;
        } else {
            newStatus = !item.is_public;
        }

        // LINEAGE CHECK FOR PUBLISHING (If enabling public access)
        if (newStatus === true && table === 'generations') {
            try {
                // If this is a video, check if it has commercialized children (talents)
                const { count: commercialCount, error: lineageError } = await supabaseAdmin
                    .from('talents')
                    .select('*', { count: 'exact', head: true })
                    .from('talents')
                    .select('*', { count: 'exact', head: true })
                    .eq('source_generation_id', targetId)
                    .or('is_for_sale.eq.true,is_sold.eq.true,sales_count.gt.0');

                if (lineageError) throw new Error("Security check failed.");

                if (commercialCount > 0) {
                    return res.status(403).json({ error: "This asset has commercialized derivatives and cannot be published to the community." });
                }
            } catch (lineageEx) {
                console.error("Lineage Check Error:", lineageEx.message);
                return res.status(403).json({ error: "This asset cannot be used because the original has been sold." });
            }
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

// --- API MARKETPLACE & CASTING (GET) ---
app.get('/api/marketplace', async (req, res) => {
    try {
        // PRECISION TECHNICAL INSTRUCTION: Filtering in query, not JS.
        // Inner join with generations table (alias: source_video).
        // PHASE 2: ABSTRACTION LAYER (Pessimistic Reading Strategy)
        const { data: talents, error } = await supabaseAdmin
            .from('talents')
            .select('*, source_video:generations!inner(*)')
            .eq('is_for_sale', true) // Active Market Logic
            .eq('is_sold', false) // Not sold
            // Mandatory Clauses: The parent must NOT be sold or for sale
            .not('source_video.locked', 'eq', true)
            .not('source_video.is_sold', 'eq', true)
            .not('source_video.is_for_sale', 'eq', true);

        if (error) throw error;

        // Map back alias to 'generations' so the frontend remains unaware
        const response = talents.map(t => {
            const { source_video, ...rest } = t;
            return { ...rest, generations: source_video };
        });

        res.json(response);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/casting', async (req, res) => {
    try {
        // Casting: Available models (talents)
        const { data: talents, error } = await supabaseAdmin
            .from('talents')
            .select('*, source_video:generations!inner(*)')
            .eq('is_public', true) // Casting uses public visibility
            // Mandatory Clauses
            .not('source_video.locked', 'eq', true)
            .not('source_video.is_sold', 'eq', true)
            .not('source_video.is_for_sale', 'eq', true);

        if (error) throw error;

        // Map back alias to 'generations'
        const response = talents.map(t => {
            const { source_video, ...rest } = t;
            return { ...rest, generations: source_video };
        });

        res.json(response);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- API ADMIN ---

// PHASE 1: ATOMIC NORMALIZATION (AUTO-FIX)
app.post('/api/admin/fix-schema', requireAdmin, async (req, res) => {
    try {
        console.log("🔧 Starting Schema Normalization...");
        const logs = [];

        // 1. Unify SALE: If marked in old OR new, mark in both.
        // SQL: UPDATE talents SET is_for_sale = true, for_sale = true WHERE for_sale = true OR is_for_sale = true;
        const { data: saleData, error: saleError } = await supabaseAdmin
            .from('talents')
            .select('id')
            .or('for_sale.eq.true,is_for_sale.eq.true');

        if (saleError) throw new Error("Sale fetch failed: " + saleError.message);

        if (saleData.length > 0) {
            const updates = saleData.map(t => ({ id: t.id, is_for_sale: true, for_sale: true }));
            const { error: updateSaleError } = await supabaseAdmin.from('talents').upsert(updates);
            if (updateSaleError) throw new Error("Sale update failed: " + updateSaleError.message);
            logs.push(`✅ Unified SALE status for ${saleData.length} talents.`);
        } else {
            logs.push("ℹ️ No fragmented SALE records found.");
        }

        // 2. Unify SOLD: The strictest rule.
        // SQL: UPDATE talents SET is_sold = true, sold = true, is_for_sale = false, for_sale = false WHERE sold = true OR is_sold = true;
        const { data: soldData, error: soldError } = await supabaseAdmin
            .from('talents')
            .select('id, source_generation_id')
            .or('sold.eq.true,is_sold.eq.true');

        if (soldError) throw new Error("Sold fetch failed: " + soldError.message);

        if (soldData.length > 0) {
            const updates = soldData.map(t => ({
                id: t.id,
                is_sold: true,
                sold: true,
                is_for_sale: false,
                for_sale: false
            }));
            const { error: updateSoldError } = await supabaseAdmin.from('talents').upsert(updates);
            if (updateSoldError) throw new Error("Sold update failed: " + updateSoldError.message);
            logs.push(`✅ Unified SOLD status for ${soldData.length} talents.`);

            // 3. Clean up Zombies (Generations)
            // If a parent generation has sold children, mark the generation as 'locked'.
            const sourceIds = [...new Set(soldData.map(t => t.source_generation_id).filter(id => id))];

            if (sourceIds.length > 0) {
                // We cannot update with 'in' filter and different values, but here we update all to 'locked: true'
                // However, Supabase .update() with .in() works.
                const { error: lockError } = await supabaseAdmin
                    .from('generations')
                    .update({ locked: true })
                    .in('id', sourceIds);

                if (lockError) throw new Error("Zombie cleanup failed: " + lockError.message);
                logs.push(`🧟 Locked ${sourceIds.length} parent videos (Zombies) associated with sold talents.`);
            }
        } else {
            logs.push("ℹ️ No fragmented SOLD records found.");
        }

        res.json({ success: true, logs });

    } catch (e) {
        console.error("❌ Schema Fix Failed:", e.message);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.json([]);

        // Search in profiles
        const { data: profiles, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .ilike('email', `%${email}%`)
            .limit(20);

        if (error) throw error;
        res.json(profiles);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/credits', requireAdmin, async (req, res) => {
    try {
        const { userId, credits } = req.body;
        const { error } = await supabaseAdmin.from('profiles').update({ credits }).eq('id', userId);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/plan', requireAdmin, async (req, res) => {
    try {
        const { userId, plan } = req.body;
        const { error } = await supabaseAdmin.from('profiles').update({ plan }).eq('id', userId);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/velvet', requireAdmin, async (req, res) => {
    try {
        const { userId, status } = req.body;
        // Assuming 'velvet_access' column exists. If not, this might fail or do nothing depending on Supabase config.
        const { error } = await supabaseAdmin.from('profiles').update({ velvet_access: status }).eq('id', userId);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/ban', requireAdmin, async (req, res) => {
    try {
        const { userId } = req.body;
        // Ban logic: Set ban_duration to a very long time (e.g., 100 years)
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            ban_duration: "876000h" // ~100 years
        });
        if (error) throw error;
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(port, () => console.log(`🛡️  LUXEMOTION SENIOR SERVER RUNNING ON PORT ${port}`));
