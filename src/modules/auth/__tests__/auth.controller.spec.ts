import { AuthController } from '../../auth/auth.controller';
import type { AuthService } from '../../auth/auth.service';
import type { AuditLogService } from '../../audit/audit-log.service';

type MockSession = {
  regenerate?: (cb: (err?: unknown) => void) => void;
  save?: (cb?: () => void) => void;
  adminUserId?: string;
  lastActivityAt?: string;
};

type MockReq = { session?: MockSession; ip?: string; query: Record<string, unknown> };

type MockRes = {
  render: jest.Mock;
  redirect: jest.Mock;
};

type LoginReq = Parameters<AuthController['login']>[1];
type LoginRes = Parameters<AuthController['login']>[2];

const makeReq = (session: MockSession = {}): MockReq => ({ session, ip: '127.0.0.1', query: {} });
const makeRes = (): MockRes => ({ render: jest.fn(), redirect: jest.fn() });

describe('AuthController (unit)', () => {
  test('login failure records audit and renders error', async () => {
    const authService = { validateAdmin: jest.fn().mockResolvedValue(null) };
    const auditService = { record: jest.fn().mockResolvedValue(null) };

    const ctrl = new AuthController(authService as unknown as AuthService, auditService as unknown as AuditLogService);

    const req = makeReq();
    const res = makeRes();

    await ctrl.login(
      { email: 'x@y.test', password: 'bad' },
      req as unknown as LoginReq,
      res as unknown as LoginRes
    );

    expect(auditService.record).toHaveBeenCalledWith(null, 'login_failed', expect.any(Object));
    expect(res.render).toHaveBeenCalledWith('auth/login', { error: 'Email atau password salah' });
  });

  test('login success records audit and redirects', async () => {
    const admin = { id: 'admin-1', email: 'a@b.c' };
    const authService = { validateAdmin: jest.fn().mockResolvedValue(admin) };
    const auditService = { record: jest.fn().mockResolvedValue(null) };

    const ctrl = new AuthController(authService as unknown as AuthService, auditService as unknown as AuditLogService);

    const req: MockReq = { session: { regenerate: (cb) => cb() }, ip: '127.0.0.1', query: {} };
    const res = makeRes();

    await ctrl.login(
      { email: 'a@b.c', password: 'ok' },
      req as unknown as LoginReq,
      res as unknown as LoginRes
    );

    expect(auditService.record).toHaveBeenCalledWith(admin.id, 'login_success', expect.any(Object));
    expect(res.redirect).toHaveBeenCalledWith('/admin');
  });
});
