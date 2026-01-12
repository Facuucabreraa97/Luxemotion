import express from 'express';
import cors from 'cors';
import Replicate from 'replicate';
import dotenv from 'dotenv';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import helmet from 'helmet';
import compression from 'compression';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// --- CACHE ---
let exchangeRateCache = {
  rate: null,
  timestamp: 0
};

const CACHE_DURATION = 3600 * 1000; // 1 hora

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
    console.error("Error fetching exchange rate, using fallback:", error.message);
  }

  return exchangeRateCache.rate || 1200; // Fallback
}

// --- CONFIGURACIÓN ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY);

const mpAccessToken = process.env.MP_ACCESS_TOKEN || 'TEST-TOKEN';
const client = new MercadoPagoConfig({ accessToken: mpAccessToken });

const replicateToken = process.env.REPLICATE_API_TOKEN;
const replicate = new Replicate({ auth: replicateToken });

// --- MIDDLEWARE ---
app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] }));
app.use(express.json({ limit: '50mb' }));

// --- API GENERAR VIDEO (MOTOR VELVET ULTRA) ---
app.post('/api/generate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error("Falta Token");
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error("Usuario inválido");

    if (!replicateToken) throw new Error("Falta configurar Replicate API Token");

    // 1. Costos
    const { duration, mode, prompt, aspectRatio, image, inputVideo, endImage, velvetStyle } = req.body;
    let cost = Number(duration) === 5 ? 10 : 20;
    if (mode === 'velvet') cost += 10; // Plus por calidad Velvet

    // 2. Verificar Saldo
    const { data: profile } = await supabaseAdmin.from('profiles').select('credits, is_admin').eq('id', user.id).single();
    if (!profile) throw new Error("Perfil no encontrado");

    // Check if admin
    const isAdmin = profile.is_admin === true;

    if (!isAdmin && profile.credits < cost) {
      throw new Error(`Saldo insuficiente (${profile?.credits}cr). Necesitas ${cost}cr.`);
    }

    // 3. Descontar (Only if not admin)
    if (!isAdmin) {
      await supabaseAdmin.from('profiles').update({ credits: profile.credits - cost }).eq('id', user.id);
    }

    // 4. INGENIERÍA DE PROMPTS "ULTRA HOT"
    let stylePrompt = "";

    if (mode === 'velvet') {
        const skinOptimizer = ", (skin texture:1.4), (visible pores:1.3)";
        switch (velvetStyle) {
            case 'boudoir': // Mapped to 'Hentai/Anime' as per expert prompt engineering request
                stylePrompt = ", hyperrealistic anime adaptation, unreal proportions but realistic skin texture, subsurface scattering, fantasy lingerie, neon ambient light";
                break;
            case 'cosplay': // Cosplay Realism
                stylePrompt = ", bedroom cosplay, (fabric texture:1.3), (stitching details:1.2), realistic latex reflection";
                break;
            default: // Leaked Tape (leaked) / Leaked/Homemade
                 stylePrompt = ", (camera noise:1.2), (motion blur:1.1), flash photography, poor lighting, authentic look, authentic amateur vibe";
        }
        stylePrompt += skinOptimizer;
    } else {
        stylePrompt = ", cinematic lighting, commercial grade, sharp focus, masterpiece, shot on ARRI Alexa, color graded, professional studio, vogue magazine style, 4k, clean composition";
    }

    // Strong negative prompts for Velvet mode to ensure realism
    const negativePrompt = mode === 'velvet'
        ? "censor bars, mosaic, blur, cartoonish skin, airbrushed, plastic look, 3d render, plastic, doll, smooth skin, cartoon, illustration, symmetry, cgi, drawing, doll-like, deformed, ugly, watermark, text, low quality, distortion, bad anatomy, extra limbs"
        : "cartoon, drawing, illustration, plastic skin, doll-like, deformed, ugly, blur, watermark, text, low quality, distortion, bad anatomy, extra limbs, cgi, 3d render";

    const inputPayload = {
      prompt: (prompt || "Beautiful subject") + stylePrompt,
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

    console.log(`🎬 Generando ${mode.toUpperCase()} (${velvetStyle || 'std'}) para ${user.email}`);
    const output = await replicate.run("kwaivgi/kling-v2.5-turbo-pro", { input: inputPayload });
    const remoteUrl = Array.isArray(output) ? output[0] : output;

    // 5. Guardar en Nube
    const videoRes = await fetch(remoteUrl);
    const videoBlob = await videoRes.arrayBuffer();
    const fileName = `luxe_${user.id}_${Date.now()}.mp4`;

    const { error: uploadError } = await supabaseAdmin.storage
        .from('videos')
        .upload(fileName, videoBlob, { contentType: 'video/mp4' });

    if (uploadError) throw new Error("Error subiendo a nube: " + uploadError.message);

    const { data: { publicUrl } } = supabaseAdmin.storage.from('videos').getPublicUrl(fileName);

    await supabaseAdmin.from('generations').insert({
        user_id: user.id,
        video_url: publicUrl,
        prompt: prompt,
        aspect_ratio: aspectRatio,
        cost: cost
    });

    res.json({ videoUrl: publicUrl, cost, remainingCredits: isAdmin ? profile.credits : profile.credits - cost });

  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- API PAGOS (Con Conversión USD/ARS) ---
app.post('/api/create-preference', async (req, res) => {
  try {
    const { title, price, quantity, currency } = req.body;

    // Si es ARS, asumimos un cambio manual o fijo para el ejemplo
    // En producción conectarías una API de cambio real
    let finalPrice = price;
    if (currency !== 'ARS') {
      const rate = await getUsdToArsRate();
      finalPrice = price * rate;
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [{ title, unit_price: Number(finalPrice), quantity: Number(quantity), currency_id: 'ARS' }], // MP suele procesar en moneda local
        back_urls: { success: `${clientUrl}/billing?status=success`, failure: `${clientUrl}/billing?status=failure` },
        auto_return: "approved",
      }
    });
    res.json({ url: result.init_point });
  } catch (error) {
    res.status(500).json({ error: "Error pago" });
  }
});

app.listen(port, () => console.log(`🛡️ SERVER LUXE (ULTRA HOT) EN PUERTO ${port}`));
