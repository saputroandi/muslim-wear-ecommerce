import { Injectable } from "@nestjs/common";

@Injectable()
export class PaymentsService {
  starterStatus(): { module: string; status: string; note: string } {
    return {
      module: "payments",
      status: "starter-ready",
      note: "Alur transfer manual/gateway akan ditambahkan di fase implementasi roadmap."
    };
  }
}

