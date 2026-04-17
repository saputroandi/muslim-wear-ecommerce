import { Body, Controller, Get, Post, Render, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { AuditLogService } from "../audit/audit-log.service";
import { ForgotPasswordDto } from "./dto/forgot.dto";
import { LoginDto } from "./dto/login.dto";
import { ResetPasswordDto } from "./dto/reset.dto";
import { AuthService } from "./auth.service";

interface AdminSession {
  adminUserId?: string;
  lastActivityAt?: string;
  csrfToken?: string;
  regenerate?: (cb: (err?: unknown) => void) => void;
  save?: (cb: (err?: unknown) => void) => void;
  destroy?: (cb: (err?: unknown) => void) => void;
}

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly audit: AuditLogService
  ) {}

  @Get("auth/login")
  @Render("auth/login")
  loginForm(@Req() req: Request): { error?: string } {
    const reason = typeof req.query.reason === "string" ? req.query.reason : undefined;
    const error = reason === "expired" ? "Sesi berakhir, silakan login ulang" : undefined;
    return { error };
  }

  @Post("auth/login")
  async login(@Body() body: LoginDto, @Req() req: Request & { session?: AdminSession }, @Res() res: Response) {
    const { email, password } = body;
    const admin = await this.authService.validateAdmin(email, password);
    if (!admin) {
      await this.audit.record(null, "login_failed", { ip: req.ip, email });
      return res.render("auth/login", { error: "Email atau password salah" });
    }

    await this.audit.record(admin.id, "login_success", { ip: req.ip });

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
        // ensure session is saved before redirect (fallback to immediate redirect)
        if (typeof req.session.save === "function") {
          req.session.save(() => res.redirect("/admin"));
        } else {
          res.redirect("/admin");
        }
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
    const adminUserId = req.session?.adminUserId ?? null;
    await this.audit.record(adminUserId, "logout", { ip: req.ip });

    if (req.session) {
      req.session.destroy?.(() => {
        res.clearCookie("connect.sid");
        return res.redirect("/auth/login");
      });
    } else {
      return res.redirect("/auth/login");
    }
  }

  @Get("auth/forgot-password")
  @Render("auth/forgot")
  forgotForm(): { error?: string; info?: string } {
    return { error: undefined, info: undefined };
  }

  @Post("auth/forgot-password")
  async forgot(@Body() body: ForgotPasswordDto, @Res() res: Response) {
    const { email } = body;
    await this.authService.createPasswordResetToken(email);

    // Always respond with generic message.
    // Do not log or expose reset token in runtime logs.
    return res.render("auth/forgot", { info: "Jika email terdaftar, link reset akan dikirim." });
  }

  @Get("auth/reset-password")
  @Render("auth/reset")
  resetForm(@Req() req: Request): { error?: string; token?: string; email?: string } {
    const token = typeof req.query.token === "string" ? req.query.token : undefined;
    const email = typeof req.query.email === "string" ? req.query.email : undefined;
    return { token, email };
  }

  @Post("auth/reset-password")
  async reset(@Body() body: ResetPasswordDto, @Res() res: Response) {
    const { email, token, password } = body;
    const ok = await this.authService.resetPassword(email, token, password);
    if (!ok) {
      return res.render("auth/reset", { error: "Token tidak valid atau sudah kadaluarsa", token, email });
    }

    return res.render("auth/login", { error: "Password berhasil direset. Silakan login." });
  }

  @Get("api/auth/starter-status")
  starterStatus(): { module: string; status: string; note: string } {
    return this.authService.starterStatus();
  }
}

