import { HealthService } from "./health.service";

describe("HealthService", () => {
  it("returns status ok", () => {
    const service = new HealthService();
    const result = service.check();

    expect(result.status).toBe("ok");
    expect(typeof result.uptimeSeconds).toBe("number");
    expect(typeof result.timestamp).toBe("string");
  });
});

