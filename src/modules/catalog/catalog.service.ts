import { Injectable } from "@nestjs/common";

@Injectable()
export class CatalogService {
  starterStatus(): { module: string; status: string; note: string } {
    return {
      module: "catalog",
      status: "starter-ready",
      note: "CRUD produk, kategori, varian, dan stok akan diimplementasikan pada issue roadmap."
    };
  }
}

