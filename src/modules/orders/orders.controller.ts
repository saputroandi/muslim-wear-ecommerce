import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";

@Controller("api/orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get("starter-status")
  starterStatus(): { module: string; status: string; note: string } {
    return this.ordersService.starterStatus();
  }

  @Post()
  create(@Body() body: CreateOrderDto) {
    return this.ordersService.createOrder(body);
  }

  @Post(":id/cancel")
  cancel(@Param("id") id: string) {
    return this.ordersService.cancelOrder(id);
  }

  @Post(":id/confirm")
  confirm(@Param("id") id: string) {
    return this.ordersService.confirmOrder(id);
  }
}
