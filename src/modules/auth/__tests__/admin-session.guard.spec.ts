import { ExecutionContext } from '@nestjs/common';
import { AdminSessionGuard } from '../../auth/admin-session.guard';

type MockSession = {
  adminUserId?: string;
  lastActivityAt?: string;
  destroy?: (cb?: () => void) => void;
};

type MockReq = { session?: MockSession };

type MockRes = {
  redirect: jest.Mock;
  clearCookie?: jest.Mock;
};

function makeContext(req: MockReq, res: MockRes): ExecutionContext {
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
    const req: MockReq = { session: { adminUserId: 'id-1', lastActivityAt: new Date().toISOString() } };
    const res: MockRes = { redirect: jest.fn() };
    const ctx = makeContext(req, res);

    const result = guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(req.session?.lastActivityAt).toBeDefined();
  });

  test('redirects when no session', () => {
    const req: MockReq = {};
    const res: MockRes = { redirect: jest.fn() };
    const ctx = makeContext(req, res);

    const result = guard.canActivate(ctx);
    expect(result).toBe(false);
    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
  });

  test('destroys session and redirects when idle expired', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 60 minutes ago
    const destroyed = { called: false };

    const req: MockReq = {
      session: {
        adminUserId: 'id-1',
        lastActivityAt: past,
        destroy: (cb?: () => void) => {
          destroyed.called = true;
          if (cb) cb();
        }
      }
    };

    const res: MockRes = { redirect: jest.fn(), clearCookie: jest.fn() };
    const ctx = makeContext(req, res);

    process.env.SESSION_IDLE_MINUTES = '30';
    const result = guard.canActivate(ctx);
    expect(result).toBe(false);
    expect(destroyed.called).toBe(true);
    expect(res.redirect).toHaveBeenCalled();
  });
});
