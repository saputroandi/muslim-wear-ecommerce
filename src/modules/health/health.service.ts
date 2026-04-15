import { Injectable } from "@nestjs/common";

@Injectable()
export class HealthService {
  check(): { status: string; uptimeSeconds: number; timestamp: string } {
    return {
      status: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    };
  }
}

