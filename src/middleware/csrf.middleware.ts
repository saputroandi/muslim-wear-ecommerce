import type { NextFunction, Request, Response } from "express";
import { randomBytes } from "node:crypto";

type CsrfSession = Record<string, unknown> & {
  csrfToken?: string;
  save?: (cb: (err?: unknown) => void) => void;
};

function isDebugEnabled(): boolean {
  const v = (process.env.CSRF_DEBUG ?? "").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

export function csrfMiddleware(req: Request & { session?: CsrfSession }, res: Response, next: NextFunction) {
  // Expose token on GET/HEAD so templates can embed it
  if (req.method === "GET" || req.method === "HEAD") {
    if (!req.session) {
      if (isDebugEnabled()) console.warn("[CSRF] session not initialized on", req.method, req.path);
      return next();
    }

    if (!req.session.csrfToken) {
      req.session.csrfToken = randomBytes(16).toString("hex");

      // Ensure token is persisted early (helps when using external session store)
      if (typeof req.session.save === "function") {
        req.session.save((err?: unknown) => {
          if (err) console.error("[CSRF] failed to save session:", err);
        });
      }
    }

    res.locals.csrfToken = req.session.csrfToken;
    return next();
  }

  // For state-changing requests, validate token
  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE" || req.method === "PATCH") {
    const bodyUnknown: unknown = (req as unknown as { body?: unknown }).body;
    let tokenFromBody: string | undefined;
    if (bodyUnknown && typeof bodyUnknown === "object" && "_csrf" in bodyUnknown) {
      const v = (bodyUnknown as Record<string, unknown>)._csrf;
      if (typeof v === "string") tokenFromBody = v;
    }

    const token =
      tokenFromBody || (req.headers["x-csrf-token"] as string) || (req.headers["x-xsrf-token"] as string);

    const fail = (reason: string) => {
      if (isDebugEnabled()) console.warn(`[CSRF] ${reason} on ${req.method} ${req.path}`);
      res.status(403).send(isProd() ? "Invalid CSRF token" : `Invalid CSRF token (${reason})`);
    };

    if (!req.session) return fail("no session");
    if (!token) return fail("no token");
    if (!req.session.csrfToken) return fail("server token missing");

    if (token !== req.session.csrfToken) {
      if (isDebugEnabled()) {
        console.warn(
          `[CSRF] token mismatch on ${req.method} ${req.path}: client=${String(token).slice(0, 8)}... server=${String(
            req.session.csrfToken
          ).slice(0, 8)}...`
        );
      }
      return fail("mismatch");
    }

    return next();
  }

  return next();
}
