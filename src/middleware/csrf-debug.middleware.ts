import type { NextFunction, Request, Response } from "express";

function isEnabled(): boolean {
  const v = (process.env.CSRF_DEBUG ?? "").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

type DebugSession = Record<string, unknown> & { csrfToken?: string };

export function csrfDebugMiddleware(req: Request & { session?: DebugSession }, _res: Response, next: NextFunction) {
  if (!isEnabled()) return next();

  const isRelevant = req.path.includes("/auth") || req.path.includes("/api/admin");
  if (!isRelevant) return next();

  const headerToken = (req.headers["x-csrf-token"] as string) || (req.headers["x-xsrf-token"] as string);

  const bodyUnknown: unknown = (req as unknown as { body?: unknown }).body;
  let bodyToken: string | undefined;
  if (bodyUnknown && typeof bodyUnknown === "object" && "_csrf" in bodyUnknown) {
    const v = (bodyUnknown as Record<string, unknown>)._csrf;
    if (typeof v === "string") bodyToken = v;
  }

  console.log(`[CSRF-DEBUG] ${req.method} ${req.path}`);
  console.log(`  - session exists: ${!!req.session}`);
  console.log(`  - session.csrfToken: ${req.session?.csrfToken ?? "undefined"}`);
  console.log(`  - body._csrf: ${bodyToken ?? "undefined"}`);
  console.log(`  - header x-csrf-token/x-xsrf-token: ${headerToken ?? "undefined"}`);

  next();
}
