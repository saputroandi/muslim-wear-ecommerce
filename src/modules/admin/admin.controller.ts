import { Controller, Get, Render, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminSessionGuard } from "../auth/admin-session.guard";

@Controller("admin")
@UseGuards(AdminSessionGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Render("admin")
  dashboard(): { appName: string; title: string; intro: string; starterScopes: string[] } {
    return this.adminService.getDashboardData();
  }
}

