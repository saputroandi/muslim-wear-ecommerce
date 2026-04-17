import { Request, Response, NextFunction } from 'express';

export function createRateLimiter(options?: { windowMs?: number; max?: number }) {
  const windowMs = options?.windowMs ?? 15 * 60_000; // 15 minutes
  const max = options?.max ?? 5;
  const hits = new Map<string, { count: number; first: number }>();

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const key = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now - entry.first > windowMs) {
      hits.set(key, { count: 1, first: now });
    } else {
      entry.count += 1;
      hits.set(key, entry);
    }

    const current = hits.get(key)!;
    if (current.count > max) {
      res.status(429).send('Too many requests. Please try again later.');
      return;
    }
    next();
  };
}
