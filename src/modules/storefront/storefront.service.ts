import { Injectable } from "@nestjs/common";

type ProductHighlight = {
  name: string;
  category: string;
  priceLabel: string;
};

@Injectable()
export class StorefrontService {
  getLandingPageData(): {
    appName: string;
    headline: string;
    subtitle: string;
    featuredProducts: ProductHighlight[];
  } {
    return {
      appName: process.env.APP_NAME ?? "Muslim Wear Ecommerce",
      headline: "Starter ecommerce siap scale bertahap",
      subtitle:
        "Fondasi NestJS MVC + PostgreSQL + Docker untuk implementasi roadmap fitur dari basic ke advanced.",
      featuredProducts: this.getFeaturedProducts()
    };
  }

  getProductsPageData(): { appName: string; featuredProducts: ProductHighlight[] } {
    return {
      appName: process.env.APP_NAME ?? "Muslim Wear Ecommerce",
      featuredProducts: this.getFeaturedProducts()
    };
  }

  private getFeaturedProducts(): ProductHighlight[] {
    return [
      { name: "Gamis Signature", category: "Dress", priceLabel: "Mulai Rp299.000" },
      { name: "Hijab Daily Comfort", category: "Hijab", priceLabel: "Mulai Rp89.000" },
      { name: "Koko Premium Linen", category: "Menswear", priceLabel: "Mulai Rp249.000" }
    ];
  }
}

