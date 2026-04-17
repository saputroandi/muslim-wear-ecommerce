import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminSessionGuard } from "../auth/admin-session.guard";

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminSessionGuard]
})
export class AdminModule {}

