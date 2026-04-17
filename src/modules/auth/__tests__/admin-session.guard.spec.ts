import { ExecutionContext } from '@nestjs/common';
import { AdminSessionGuard } from '../../auth/admin-session.guard';

function makeContext(req: any, res: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res
    })
  } as unknown as ExecutionContext;
}

describe('AdminSessionGuard', () => {
  const guard = new AdminSessionGuard();

  test('allows when session present and updates lastActivityAt', () => {
    const req: any = { session: { adminUserId: 'id-1', lastActivityAt: new Date().toISOString() } };
    const redirected = { redirect: jest.fn() };
    const ctx = makeContext(req, redirected);

    const result = guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(req.session.lastActivityAt).toBeDefined();
  });

  test('redirects when no session', () => {
    const req: any = {};
    const res: any = { redirect: jest.fn() };
    const ctx = makeContext(req, res);

    const result = guard.canActivate(ctx);
    expect(result).toBe(false);
    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
  });

  test('destroys session and redirects when idle expired', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 60 minutes ago
    const destroyed = { called: false };
    const req: any = {
      session: {
        adminUserId: 'id-1',
        lastActivityAt: past,
        destroy: (cb: any) => { destroyed.called = true; cb && cb(); }
      }
    };
    const res: any = { redirect: jest.fn(), clearCookie: jest.fn() };
    const ctx = makeContext(req, res);

    // set env to short timeout for test
    process.env.SESSION_IDLE_MINUTES = '30';
    const result = guard.canActivate(ctx);
    expect(result).toBe(false);
    expect(destroyed.called).toBe(true);
    expect(res.redirect).toHaveBeenCalled();
  });
});
