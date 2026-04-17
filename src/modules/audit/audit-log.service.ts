import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "../../persistence/entities/audit-log.entity";

@Injectable()
export class AuditLogService {
  constructor(@InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>) {}

  async record(
    adminUserId: string | null,
    action: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.repo.save({
        adminUserId: adminUserId ?? undefined,
        action,
        metadata: metadata ?? null
      });
    } catch (err) {
      // Audit failure should be visible but must not leak sensitive data
      console.error("AuditLogService.record failed", err);
    }
  }
}
