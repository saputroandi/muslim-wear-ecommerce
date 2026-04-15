import { Injectable } from "@nestjs/common";

@Injectable()
export class AuthService {
  starterStatus(): { module: string; status: string; note: string } {
    return {
      module: "auth",
      status: "starter-ready",
      note: "Flow autentikasi admin tunggal belum diimplementasikan."
    };
  }
}

