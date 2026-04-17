import { AuthService } from '../../auth/auth.service';
import type { Repository } from 'typeorm';
import type { AdminUser } from '../../../persistence/entities/admin-user.entity';
import type { PasswordResetToken } from '../../../persistence/entities/password-reset-token.entity';
import * as bcrypt from 'bcryptjs';

describe('AuthService (unit)', () => {
  test('create and validate password reset token flow (in-memory repos)', async () => {
    // in-memory admin repo
    const admins = [{ id: 'a1', email: 'a@b.c', passwordHash: await bcrypt.hash('oldpass', 10), isActive: true }];
    const adminRepo = {
      findOneBy: jest.fn((q: { email: string }) => Promise.resolve(admins.find(a => a.email === q.email))),
      save: jest.fn((a: unknown) => Promise.resolve(a))
    };

    const tokens: Array<{ adminUserId: string; tokenHash: string; expiresAt: Date; usedAt?: Date; id: string; createdAt: Date }> = [];
    const tokenRepo = {
      save: jest.fn((t: { adminUserId: string; tokenHash: string; expiresAt: Date; usedAt?: Date }) => {
        tokens.push({ ...t, id: `t${tokens.length + 1}`, createdAt: new Date() });
        return Promise.resolve(t);
      }),
      findOne: jest.fn((opts: { where: { adminUserId: string; usedAt?: unknown; expiresAt?: { value?: Date; _value?: Date } } }) => {
        const adminUserId = opts.where.adminUserId;
        const now = opts.where.expiresAt?.value ?? opts.where.expiresAt?._value ?? null;
        const requireUnused = Boolean(opts.where.usedAt);

        const row = tokens
          .filter(t => t.adminUserId === adminUserId)
          .filter(t => (requireUnused ? !t.usedAt : true))
          .filter(t => (now ? t.expiresAt > now : true))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

        return Promise.resolve(row ?? null);
      })
    };

    const svc = new AuthService(
      adminRepo as unknown as Repository<AdminUser>,
      tokenRepo as unknown as Repository<PasswordResetToken>
    );

    const token = await svc.createPasswordResetToken('a@b.c', 1);
    expect(token).toBeTruthy();

    // invalid token should fail
    const bad = await svc.resetPassword('a@b.c', 'wrong', 'newpass');
    expect(bad).toBe(false);

    // valid token should succeed
    const ok = await svc.resetPassword('a@b.c', token!, 'newpass');
    expect(ok).toBe(true);

    // subsequent use should fail
    const again = await svc.resetPassword('a@b.c', token!, 'x');
    expect(again).toBe(false);
  });
});
