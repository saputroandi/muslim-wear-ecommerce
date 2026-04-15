import { Controller, Get } from "@nestjs/common";
import { CatalogService } from "./catalog.service";

@Controller("api/catalog")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("starter-status")
  starterStatus(): { module: string; status: string; note: string } {
    return this.catalogService.starterStatus();
  }
}

