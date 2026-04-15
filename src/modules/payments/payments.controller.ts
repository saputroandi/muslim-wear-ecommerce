import { Controller, Get } from "@nestjs/common";
import { PaymentsService } from "./payments.service";

@Controller("api/payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get("starter-status")
  starterStatus(): { module: string; status: string; note: string } {
    return this.paymentsService.starterStatus();
  }
}

