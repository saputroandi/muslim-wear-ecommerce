import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "audit_logs" })
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "admin_user_id", type: "uuid", nullable: true })
  adminUserId?: string;

  @Column({ type: "varchar", length: 100 })
  action!: string;

  @Column({ name: "metadata", type: "json", nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
