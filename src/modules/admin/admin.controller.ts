import { Controller, Get, Render } from "@nestjs/common";
import { AdminService } from "./admin.service";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Render("admin")
  dashboard(): { appName: string; title: string; intro: string; starterScopes: string[] } {
    return this.adminService.getDashboardData();
  }
}

