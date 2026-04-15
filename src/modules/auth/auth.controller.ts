import { Controller, Get, Post, Body, Render, Req, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Request, Response } from "express";

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("auth/login")
  @Render("auth/login")
  loginForm(): { error?: string } {
    return { error: undefined };
  }

  @Post("auth/login")
  async login(
    @Body() body: { email: string; password: string },
    @Req() req: Request & { session?: any },
    @Res() res: Response
  ) {
    const { email, password } = body;
    const admin = await this.authService.validateAdmin(email, password);
    if (!admin) {
      return res.render("auth/login", { error: "Email atau password salah" });
    }

    // set session
    if (!req.session) req.session = {} as any;
    req.session.adminUserId = admin.id;
    req.session.lastActivityAt = new Date().toISOString();

    return res.redirect("/admin");
  }

  @Post("auth/logout")
  logout(@Req() req: Request & { session?: any }, @Res() res: Response) {
    if (req.session) {
      req.session.destroy?.(() => {
        res.clearCookie("connect.sid");
        return res.redirect("/auth/login");
      });
    } else {
      return res.redirect("/auth/login");
    }
  }

  @Get("api/auth/starter-status")
  starterStatus(): { module: string; status: string; note: string } {
    return this.authService.starterStatus();
  }
}

