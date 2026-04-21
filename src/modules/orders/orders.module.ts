import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { Order } from "../../persistence/entities/order.entity";
import { OrderItem } from "../../persistence/entities/order-item.entity";
import { ProductModule } from "../product/product.module";

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem]), ProductModule],
  controllers: [OrdersController],
  providers: [OrdersService]
})
export class OrdersModule {}
