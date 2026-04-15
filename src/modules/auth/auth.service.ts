import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AdminUser } from "../../persistence/entities/admin-user.entity";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AdminUser) private readonly adminRepo: Repository<AdminUser>
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
}

