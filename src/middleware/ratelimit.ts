import type { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis.js";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix: string;
  keyFn: (req: Request) => string | null;
}

function rateLimit({ windowMs, max, keyPrefix, keyFn }: RateLimitOptions) {
  const windowSec = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction) => {
    const id = keyFn(req);
    if (!id) return next();

    const key = `rl:${keyPrefix}:${id}`;

    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSec);
    }

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - current));

    if (current > max) {
      const ttl = await redis.ttl(key);
      res.setHeader("Retry-After", Math.max(ttl, 1));
      res.status(429).json({ error: "Trop de requêtes, réessayez plus tard" });
      return;
    }

    next();
  };
}

/** Rate limit par IP — pour les routes publiques (auth) */
export const ipRateLimit = rateLimit({
  windowMs: 60_000,
  max: 30,
  keyPrefix: "ip",
  keyFn: (req) => req.ip ?? req.socket.remoteAddress ?? null,
});

/** Rate limit par userId — pour les routes authentifiées */
export const userRateLimit = rateLimit({
  windowMs: 60_000,
  max: 100,
  keyPrefix: "user",
  keyFn: (req) => req.userId ?? null,
});
