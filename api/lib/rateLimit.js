// api/lib/rateLimit.js
// Upstash-backed rate limiter for Vercel Serverless Functions
// Falls back to in-memory limiter if Upstash env vars are not configured.

let upstashRatelimit = null;
let upstashRedis = null;

// Attempt to load Upstash (lazy, first call)
let upstashInitialized = false;
async function getUpstashLimiter(maxRequests, windowSec) {
    if (upstashInitialized) return upstashRatelimit;
    upstashInitialized = true;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
        console.warn('[RATE-LIMIT] Upstash env vars missing — using in-memory fallback (NOT safe for production)');
        return null;
    }

    try {
        const { Ratelimit } = await import('@upstash/ratelimit');
        const { Redis } = await import('@upstash/redis');
        upstashRedis = new Redis({ url, token });
        upstashRatelimit = new Ratelimit({
            redis: upstashRedis,
            limiter: Ratelimit.slidingWindow(maxRequests, `${windowSec} s`),
            analytics: false,
        });
        console.log('[RATE-LIMIT] Upstash rate limiter initialized');
        return upstashRatelimit;
    } catch (err) {
        console.warn('[RATE-LIMIT] Failed to init Upstash, falling back to in-memory:', err.message);
        return null;
    }
}

// ─── In-Memory Fallback ───────────────────────────────────
// NOTE: This is per-instance on Vercel — offers minimal protection.
const rateLimitStore = new Map();

function inMemoryRateLimit(key, maxRequests, windowMs) {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
        rateLimitStore.set(key, { windowStart: now, count: 1 });
        return { limited: false };
    }

    entry.count++;
    if (entry.count > maxRequests) {
        return {
            limited: true,
            retryAfter: Math.ceil((entry.windowStart + windowMs - now) / 1000)
        };
    }
    return { limited: false };
}

// Clean expired entries every 60 seconds
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
        if (now - entry.windowStart > 120000) {
            rateLimitStore.delete(key);
        }
    }
}, 60000);

// ─── Public API ───────────────────────────────────────────

/**
 * Rate limit check for Vercel API routes.
 * Uses Upstash Redis if configured, else degrades to in-memory.
 * @param {object} req - Vercel request object
 * @param {object} res - Vercel response object
 * @param {object} options - { maxRequests: number, windowMs: number }
 * @returns {Promise<boolean>} true if rate limited (caller should return early)
 */
export async function rateLimit(req, res, options = {}) {
    const { maxRequests = 30, windowMs = 60000 } = options;
    const windowSec = Math.ceil(windowMs / 1000);

    // Use IP + route as key
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.headers['x-real-ip']
        || req.socket?.remoteAddress
        || 'unknown';

    const route = req.url?.split('?')[0] || '/api/unknown';
    const key = `rl:${ip}:${route}`;

    // Try Upstash first
    const limiter = await getUpstashLimiter(maxRequests, windowSec);
    if (limiter) {
        try {
            const { success, remaining, reset } = await limiter.limit(key);
            res.setHeader('X-RateLimit-Remaining', remaining);
            if (!success) {
                const retryAfter = Math.ceil((reset - Date.now()) / 1000);
                res.status(429).json({
                    error: 'Too Many Requests',
                    message: `Rate limit exceeded. Max ${maxRequests} requests per ${windowSec}s.`,
                    retryAfter
                });
                return true;
            }
            return false;
        } catch (err) {
            console.error('[RATE-LIMIT] Upstash error, falling back:', err.message);
            // Fall through to in-memory
        }
    }

    // In-memory fallback
    const result = inMemoryRateLimit(key, maxRequests, windowMs);
    if (result.limited) {
        res.status(429).json({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Max ${maxRequests} requests per ${windowSec}s.`,
            retryAfter: result.retryAfter
        });
        return true;
    }

    return false;
}

/**
 * Verify JWT from Authorization header using Supabase
 * @param {object} req - Vercel request object
 * @param {object} supabase - Supabase client (with service role)
 * @returns {{ user: object|null, error: string|null }}
 */
export async function verifyAuth(req, supabase) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
        return { user: null, error: 'Missing or invalid Authorization header' };
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return { user: null, error: 'Invalid token' };
        }
        return { user, error: null };
    } catch (err) {
        return { user: null, error: 'Token verification failed' };
    }
}
