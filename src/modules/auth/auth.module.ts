import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AdminUser } from "../../persistence/entities/admin-user.entity";
import { PasswordResetToken } from "../../persistence/entities/password-reset-token.entity";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [TypeOrmModule.forFeature([AdminUser, PasswordResetToken]), AuditModule],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}

