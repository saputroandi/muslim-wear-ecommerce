import { Controller, Get, Render } from "@nestjs/common";
import { StorefrontService } from "./storefront.service";

@Controller()
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  @Get()
  @Render("home")
  home(): {
    appName: string;
    headline: string;
    subtitle: string;
    featuredProducts: Array<{ name: string; category: string; priceLabel: string }>;
  } {
    return this.storefrontService.getLandingPageData();
  }

  @Get("products")
  @Render("products")
  products(): { appName: string; featuredProducts: Array<{ name: string; category: string; priceLabel: string }> } {
    return this.storefrontService.getProductsPageData();
  }
}

