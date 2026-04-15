import { Controller, Get } from "@nestjs/common";
import { OrdersService } from "./orders.service";

@Controller("api/orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get("starter-status")
  starterStatus(): { module: string; status: string; note: string } {
    return this.ordersService.starterStatus();
  }
}

