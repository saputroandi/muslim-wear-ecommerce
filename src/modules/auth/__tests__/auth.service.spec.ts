import { AuthService } from '../../auth/auth.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService (unit)', () => {
  test('create and validate password reset token flow (in-memory repos)', async () => {
    // in-memory admin repo
    const admins = [{ id: 'a1', email: 'a@b.c', passwordHash: await bcrypt.hash('oldpass', 10), isActive: true }];
    const adminRepo: any = {
      findOneBy: jest.fn(async (q: any) => admins.find(a => a.email === q.email)),
      save: jest.fn(async (a: any) => a)
    };

    const tokens: any[] = [];
    const tokenRepo: any = {
      save: jest.fn(async (t: any) => { tokens.push({ ...t, id: 't1', createdAt: new Date() }); return t; }),
      findOne: jest.fn(async (opts: any) => tokens.filter(t => t.adminUserId === opts.where.adminUserId).sort((a,b)=>b.createdAt - a.createdAt)[0])
    };

    const svc = new AuthService(adminRepo, tokenRepo as any);

    const token = await svc.createPasswordResetToken('a@b.c', 1);
    expect(typeof token).toBe('string');

    // invalid token should fail
    const bad = await svc.resetPassword('a@b.c', 'wrong', 'newpass');
    expect(bad).toBe(false);

    // valid token should succeed
    const ok = await svc.resetPassword('a@b.c', token, 'newpass');
    expect(ok).toBe(true);

    // subsequent use should fail
    const again = await svc.resetPassword('a@b.c', token, 'x');
    expect(again).toBe(false);
  });
});
