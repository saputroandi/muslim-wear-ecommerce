import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class AdminSessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<Request & {
        session?: {
          adminUserId?: string;
          lastActivityAt?: string;
          destroy?: (cb: (err?: unknown) => void) => void;
        };
      }>();
    const res = context.switchToHttp().getResponse<Response>();

    const idleMinutes = parseInt(process.env.SESSION_IDLE_MINUTES || '30', 10);
    const now = Date.now();

    if (req.session && req.session.adminUserId) {
      const last = req.session.lastActivityAt ? new Date(req.session.lastActivityAt).getTime() : null;
      if (last && now - last > idleMinutes * 60_000) {
        // session expired due to idle timeout
        req.session.destroy?.(() => {
          try {
            res.clearCookie('connect.sid');
          } catch {
            /* ignore */
          }
          res.redirect('/auth/login?reason=expired');
        });
        return false;
      }
      // update lastActivityAt
      req.session.lastActivityAt = new Date().toISOString();
      return true;
    }

    if (res) {
      res.redirect('/auth/login');
    }
    return false;
  }
}
