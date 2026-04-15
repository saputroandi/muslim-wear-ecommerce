import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "password_reset_tokens" })
export class PasswordResetToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "admin_user_id", type: "uuid" })
  adminUserId!: string;

  @Column({ name: "token_hash", type: "varchar", length: 255 })
  tokenHash!: string;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  @Column({ name: "used_at", type: "timestamptz", nullable: true })
  usedAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
