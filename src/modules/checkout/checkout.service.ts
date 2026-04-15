import { Injectable } from "@nestjs/common";

@Injectable()
export class CheckoutService {
  starterStatus(): { module: string; status: string; note: string } {
    return {
      module: "checkout",
      status: "starter-ready",
      note: "Keranjang dan checkout flow akan mengikuti roadmap implementasi."
    };
  }
}

