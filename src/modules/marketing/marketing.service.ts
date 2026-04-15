import { Injectable } from "@nestjs/common";

@Injectable()
export class MarketingService {
  starterStatus(): { module: string; status: string; note: string } {
    return {
      module: "marketing",
      status: "starter-ready",
      note: "Tracking analytics, campaign automation, dan attribution belum diimplementasikan."
    };
  }
}

