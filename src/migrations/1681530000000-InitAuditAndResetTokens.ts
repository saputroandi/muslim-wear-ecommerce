import { MigrationInterface, QueryRunner } from "typeorm";

export class InitAuditAndResetTokens1681530000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure uuid/ossp or pgcrypto is available depending on image
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        admin_user_id uuid NULL,
        action varchar(100) NOT NULL,
        metadata json NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        admin_user_id uuid NOT NULL,
        token_hash varchar(255) NOT NULL,
        expires_at timestamptz NOT NULL,
        used_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS password_reset_tokens;`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs;`);
  }
}

export default InitAuditAndResetTokens1681530000000;
