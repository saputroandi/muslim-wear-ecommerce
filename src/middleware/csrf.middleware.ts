import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

type CsrfSession = Record<string, unknown> & { csrfToken?: string };

export function csrfMiddleware(req: Request & { session?: CsrfSession }, res: Response, next: NextFunction) {
  // Expose token on GET so templates can embed it
  if (req.method === 'GET' || req.method === 'HEAD') {
    if (req.session) {
      if (!req.session.csrfToken) req.session.csrfToken = randomBytes(16).toString('hex');
      res.locals.csrfToken = req.session.csrfToken;
    }
    return next();
  }

  // For state-changing requests, validate token
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE' || req.method === 'PATCH') {
    const token = (req.body && req.body._csrf) || (req.headers['x-csrf-token'] as string) || (req.headers['x-xsrf-token'] as string);
    if (!req.session || !req.session.csrfToken || !token || token !== req.session.csrfToken) {
      res.status(403).send('Invalid CSRF token');
      return;
    }
    return next();
  }

  return next();
}
