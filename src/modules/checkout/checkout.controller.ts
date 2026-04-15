import { Controller, Get } from "@nestjs/common";
import { CheckoutService } from "./checkout.service";

@Controller("api/checkout")
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Get("starter-status")
  starterStatus(): { module: string; status: string; note: string } {
    return this.checkoutService.starterStatus();
  }
}

