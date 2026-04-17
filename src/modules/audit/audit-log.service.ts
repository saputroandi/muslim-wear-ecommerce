import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "../../persistence/entities/audit-log.entity";

@Injectable()
export class AuditLogService {
  constructor(@InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>) {}

  async record(adminUserId: string | null, action: string, metadata?: Record<string, unknown> | null) {
    const entry = this.repo.create({
      adminUserId: adminUserId || null,
      action,
      metadata: metadata || null
    });
    return this.repo.save(entry);
  }
}
