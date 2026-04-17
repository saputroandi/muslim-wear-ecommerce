import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AdminUser } from "../../persistence/entities/admin-user.entity";
import { PasswordResetToken } from "../../persistence/entities/password-reset-token.entity";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import AppDataSource from "../../persistence/data-source";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AdminUser) private readonly adminRepo: Repository<AdminUser>,
    @InjectRepository(PasswordResetToken) private readonly tokenRepo?: Repository<PasswordResetToken>
  ) {}

  async validateAdmin(email: string, password: string): Promise<AdminUser | null> {
    const admin = await this.adminRepo.findOneBy({ email });
    if (!admin || !admin.isActive) return null;
    const ok = await bcrypt.compare(password, admin.passwordHash);
    return ok ? admin : null;
  }

  starterStatus(): { module: string; status: string; note: string } {
    return {
      module: "auth",
      status: "starter-ready",
      note: "Flow autentikasi admin tunggal: endpoints login/logout belum diproduksi."
    };
  }

  // Generate a password reset token, save its hash, and return the plaintext token (for sending)
  async createPasswordResetToken(email: string, minutesValid = 30): Promise<string | null> {
    const admin = await this.adminRepo.findOneBy({ email });
    if (!admin) return null;

    const token = randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + minutesValid * 60_000);

    // Save token via TypeORM repository if available
    if (this.tokenRepo) {
      await this.tokenRepo.save({ adminUserId: admin.id, tokenHash, expiresAt } as PasswordResetToken);
    } else {
      // best-effort: use AppDataSource to insert directly
      try {
        const repo = AppDataSource.getRepository(PasswordResetToken);
        await repo.save({ adminUserId: admin.id, tokenHash, expiresAt } as PasswordResetToken);
      } catch (err) {
        // ignore; caller will still get token but DB may not have it
        console.error("Failed to persist reset token", err);
      }
    }

    return token;
  }

  // Validate token and reset password
  async resetPassword(email: string, token: string, newPassword: string): Promise<boolean> {
    const admin = await this.adminRepo.findOneBy({ email });
    if (!admin) return false;

    // find latest unused token for this admin
    let tokenRow: PasswordResetToken | null = null;
    if (this.tokenRepo) {
      tokenRow = await this.tokenRepo.findOne({ where: { adminUserId: admin.id }, order: { createdAt: "DESC" } });
    } else {
      try {
        const repo = AppDataSource.getRepository(PasswordResetToken);
        tokenRow = await repo.findOne({ where: { adminUserId: admin.id }, order: { createdAt: "DESC" } });
      } catch (err) {
        console.error("Failed to read reset token", err);
      }
    }

    if (!tokenRow) return false;
    if (tokenRow.usedAt) return false;
    if (tokenRow.expiresAt.getTime() < Date.now()) return false;

    const ok = await bcrypt.compare(token, tokenRow.tokenHash);
    if (!ok) return false;

    // update password
    admin.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.adminRepo.save(admin);

    // mark token used
    tokenRow.usedAt = new Date();
    if (this.tokenRepo) {
      await this.tokenRepo.save(tokenRow);
    } else {
      try {
        const repo = AppDataSource.getRepository(PasswordResetToken);
        await repo.save(tokenRow);
      } catch (err) {
        console.error("Failed to mark token used", err);
      }
    }

    // revoke sessions (best-effort): delete rows from session table where sess contains adminUserId
    try {
      const table = process.env.SESSION_TABLE_NAME ?? "user_sessions";
      const repo = AppDataSource;
      if (!repo.isInitialized) await repo.initialize();
      await repo.query(`DELETE FROM ${table} WHERE sess->>'adminUserId' = $1`, [admin.id]);
    } catch (err) {
      // non-fatal
      console.error("Failed to revoke sessions for admin", err);
    }

    return true;
  }
}

