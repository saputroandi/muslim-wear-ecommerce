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

    // regenerate session to prevent session fixation
    if (req.session && typeof req.session.regenerate === "function") {
      req.session.regenerate((err: any) => {
        if (err) {
          console.error("Session regenerate error", err);
          // fallback: set session values directly
          req.session = req.session || {};
          req.session.adminUserId = admin.id;
          req.session.lastActivityAt = new Date().toISOString();
          return res.redirect("/admin");
        }
        req.session.adminUserId = admin.id;
        req.session.lastActivityAt = new Date().toISOString();
        // ensure session is saved before redirect
        req.session.save?.(() => res.redirect("/admin"));
      });
    } else {
      req.session = req.session || {};
      req.session.adminUserId = admin.id;
      req.session.lastActivityAt = new Date().toISOString();
      return res.redirect("/admin");
    }
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

