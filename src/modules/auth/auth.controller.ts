import { Controller, Get, Post, Body, Render, Req, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Request, Response } from "express";
import { AuditLogService } from "../audit/audit-log.service";

interface AdminSession {
  adminUserId?: string;
  lastActivityAt?: string;
  regenerate?: (cb: (err?: unknown) => void) => void;
  save?: (cb?: () => void) => void;
  destroy?: (cb?: () => void) => void;
}

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly auditLogService: AuditLogService) {}

  @Get("auth/login")
  @Render("auth/login")
  loginForm(@Req() req: Request): { error?: string } {
    const reason = (req as any).query?.reason;
    const error = reason === 'expired' ? 'Sesi berakhir, silakan login ulang' : undefined;
    return { error };
  }

  @Post("auth/login")
  async login(
    @Body() body: { email: string; password: string },
    @Req() req: Request & { session?: AdminSession },
    @Res() res: Response
  ) {
    const { email, password } = body;
    const admin = await this.authService.validateAdmin(email, password);
    if (!admin) {
      // record failed login (do not include password)
      try {
        await this.auditLogService.record(null, 'login_failed', { email, ip: req.ip });
      } catch (err) {
        console.error('Audit log failed', err);
      }
      return res.render("auth/login", { error: "Email atau password salah" });
    }

    // record successful login
    try {
      await this.auditLogService.record(admin.id, 'login_success', { ip: req.ip });
    } catch (err) {
      console.error('Audit log failed', err);
    }

    // regenerate session to prevent session fixation
    if (req.session && typeof req.session.regenerate === "function") {
      req.session.regenerate((err?: unknown) => {
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
  async logout(@Req() req: Request & { session?: AdminSession }, @Res() res: Response) {
    if (req.session) {
      // record logout
      try {
        await this.auditLogService.record(req.session.adminUserId || null, 'logout', { ip: req.ip });
      } catch (err) {
        console.error('Audit log failed', err);
      }

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

