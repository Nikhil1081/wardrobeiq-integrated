import { Request, Response, NextFunction } from 'express';

// Middleware to strip potentially dangerous MongoDB operators like $where, $regex injection, etc.
export function sanitizeMongoInput(req: Request, res: Response, next: NextFunction) {
  const sanitize = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitize);

    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Disallow any key starting with '$' from user input
      if (key.startsWith('$')) {
        continue;
      }
      clean[key] = sanitize(value);
    }
    return clean;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
}

// In-memory token bucket rate limiter for AI Stylist endpoints
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function aiRateLimiter(limit = 20, windowMs = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const clientRecord = rateLimitMap.get(ip);

    if (!clientRecord || now > clientRecord.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (clientRecord.count >= limit) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please slow down and try again shortly.',
        },
      });
    }

    clientRecord.count += 1;
    next();
  };
}
