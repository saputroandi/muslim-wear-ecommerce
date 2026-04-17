import { AuthController } from '../../auth/auth.controller';

const makeReq = (session: any = {}) => ({ session, ip: '127.0.0.1', query: {} } as any);
const makeRes = () => ({ render: jest.fn(), redirect: jest.fn() } as any);

describe('AuthController (unit)', () => {
  test('login failure records audit and renders error', async () => {
    const authService: any = { validateAdmin: jest.fn().mockResolvedValue(null) };
    const auditService: any = { record: jest.fn().mockResolvedValue(null) };
    // construct a controller-like object using same methods
    // import original class dynamically to avoid DI
    const { AuthController } = await import('../../auth/auth.controller');
    // create instance with mocked services
    const ctrl: any = new AuthController((authService as any), (auditService as any));

    const req = makeReq();
    const res = makeRes();

    await ctrl.login({ email: 'x@y.test', password: 'bad' }, req, res);

    expect(auditService.record).toHaveBeenCalledWith(null, 'login_failed', expect.any(Object));
    expect(res.render).toHaveBeenCalledWith('auth/login', { error: 'Email atau password salah' });
  });

  test('login success records audit and redirects', async () => {
    const admin = { id: 'admin-1', email: 'a@b.c' };
    const authService: any = { validateAdmin: jest.fn().mockResolvedValue(admin) };
    const auditService: any = { record: jest.fn().mockResolvedValue(null) };
    const { AuthController } = await import('../../auth/auth.controller');
    const ctrl: any = new AuthController((authService as any), (auditService as any));

    const req: any = { session: { regenerate: (cb: any) => cb() }, ip: '127.0.0.1' };
    const res: any = { redirect: jest.fn(), render: jest.fn() };

    await ctrl.login({ email: 'a@b.c', password: 'ok' }, req, res);

    expect(auditService.record).toHaveBeenCalledWith(admin.id, 'login_success', expect.any(Object));
    expect(res.redirect).toHaveBeenCalledWith('/admin');
  });
});
