// api/lib/rateLimit.js
// In-memory rate limiter for Vercel Serverless Functions
// Note: Each Vercel function instance has its own memory, so this is
// per-instance limiting (still effective against single-source bursts).

const rateLimitStore = new Map();

// Clean expired entries every 60 seconds
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
        if (now - entry.windowStart > 60000) {
            rateLimitStore.delete(key);
        }
    }
}, 60000);

/**
 * Rate limit check for Vercel API routes
 * @param {object} req - Vercel request object
 * @param {object} res - Vercel response object
 * @param {object} options - { maxRequests: number, windowMs: number }
 * @returns {boolean} true if rate limited (caller should return early)
 */
export function rateLimit(req, res, options = {}) {
    const { maxRequests = 30, windowMs = 60000 } = options;

    // Use IP + route as key
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.headers['x-real-ip']
        || req.socket?.remoteAddress
        || 'unknown';

    const route = req.url?.split('?')[0] || '/api/unknown';
    const key = `${ip}:${route}`;

    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
        // New window
        rateLimitStore.set(key, { windowStart: now, count: 1 });
        return false;
    }

    entry.count++;

    if (entry.count > maxRequests) {
        res.status(429).json({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Max ${maxRequests} requests per ${windowMs / 1000}s.`,
            retryAfter: Math.ceil((entry.windowStart + windowMs - now) / 1000)
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
