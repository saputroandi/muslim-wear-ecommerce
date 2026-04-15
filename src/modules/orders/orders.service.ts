import { Injectable } from "@nestjs/common";

@Injectable()
export class OrdersService {
  starterStatus(): { module: string; status: string; note: string } {
    return {
      module: "orders",
      status: "starter-ready",
      note: "Lifecycle order (verify-pack-ship-complete) belum diimplementasikan."
    };
  }
}

