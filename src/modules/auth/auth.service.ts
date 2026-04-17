import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, MoreThan, Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import AppDataSource from "../../persistence/data-source";
import { AdminUser } from "../../persistence/entities/admin-user.entity";
import { PasswordResetToken } from "../../persistence/entities/password-reset-token.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AdminUser) private readonly adminRepo: Repository<AdminUser>,
    @InjectRepository(PasswordResetToken) private readonly tokenRepo: Repository<PasswordResetToken>
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

  // Generate a password reset token, save its hash, and return the plaintext token (for sending out-of-band)
  async createPasswordResetToken(email: string, minutesValid = 30): Promise<string | null> {
    const admin = await this.adminRepo.findOneBy({ email });
    if (!admin) return null;

    const token = randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + minutesValid * 60_000);

    try {
      await this.tokenRepo.save({ adminUserId: admin.id, tokenHash, expiresAt } as PasswordResetToken);
      return token;
    } catch (err) {
      // Do not throw: controller should always return a generic response
      console.error("Failed to persist reset token", err);
      return null;
    }
  }

  // Validate token and reset password
  async resetPassword(email: string, token: string, newPassword: string): Promise<boolean> {
    const admin = await this.adminRepo.findOneBy({ email });
    if (!admin) return false;

    const tokenRow = await this.tokenRepo.findOne({
      where: {
        adminUserId: admin.id,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date())
      },
      order: { createdAt: "DESC" }
    });

    if (!tokenRow) return false;

    const ok = await bcrypt.compare(token, tokenRow.tokenHash);
    if (!ok) return false;

    // Mark token used first (safer than allowing reuse if later steps fail)
    tokenRow.usedAt = new Date();
    try {
      await this.tokenRepo.save(tokenRow);
    } catch (err) {
      console.error("Failed to mark token used", err);
      return false;
    }

    // update password
    admin.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.adminRepo.save(admin);

    // revoke sessions (best-effort): delete rows from session table where sess contains adminUserId
    if (process.env.NODE_ENV !== "test") {
      try {
        const table = process.env.SESSION_TABLE_NAME ?? "user_sessions";
        const repo = AppDataSource;
        if (!repo.isInitialized) await repo.initialize();
        await repo.query(`DELETE FROM ${table} WHERE sess->>'adminUserId' = $1`, [admin.id]);
      } catch (err) {
        // non-fatal
        console.error("Failed to revoke sessions for admin", err);
      }
    }

    return true;
  }
}

