import { StorefrontService } from "./storefront.service";

describe("StorefrontService", () => {
  it("returns landing page starter content", () => {
    const service = new StorefrontService();
    const result = service.getLandingPageData();

    expect(result.headline.length).toBeGreaterThan(0);
    expect(result.featuredProducts.length).toBeGreaterThan(0);
  });
});

