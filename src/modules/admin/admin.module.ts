import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminController } from "./admin.controller";
import { AdminApiController } from "./admin-api.controller";
import { AdminService } from "./admin.service";
import { AdminSessionGuard } from "../auth/admin-session.guard";
import { AuditModule } from "../audit/audit.module";
import { Product } from "../../persistence/entities/product.entity";
import { Order } from "../../persistence/entities/order.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Product, Order]), AuditModule],
  controllers: [AdminController, AdminApiController],
  providers: [AdminService, AdminSessionGuard]
})
export class AdminModule {}

