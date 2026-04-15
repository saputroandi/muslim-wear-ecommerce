import { Controller, Get } from "@nestjs/common";
import { MarketingService } from "./marketing.service";

@Controller("api/marketing")
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get("starter-status")
  starterStatus(): { module: string; status: string; note: string } {
    return this.marketingService.starterStatus();
  }
}

