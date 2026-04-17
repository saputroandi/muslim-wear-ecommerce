import { Controller, Get, Post, Body, Render, Req, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Request, Response } from "express";

interface AdminSession {
  adminUserId?: string;
  lastActivityAt?: string;
  regenerate?: (cb: (err?: unknown) => void) => void;
  save?: (cb?: () => void) => void;
  destroy?: (cb?: () => void) => void;
}

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
      return res.render("auth/login", { error: "Email atau password salah" });
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
  logout(@Req() req: Request & { session?: AdminSession }, @Res() res: Response) {
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
  async forgot(@Body() body: { email: string }, @Res() res: Response) {
    const { email } = body;
    const token = await this.authService.createPasswordResetToken(email);
    // Always respond with generic message
    if (token) {
      const base = process.env.APP_BASE_URL ?? `http://localhost:${process.env.APP_PORT ?? 3000}`;
      console.info(`Password reset link for ${email}: ${base}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`);
    }
    return res.render('auth/forgot', { info: 'Jika email terdaftar, link reset akan dikirim.' });
  }

  @Get("auth/reset-password")
  @Render("auth/reset")
  resetForm(@Req() req: Request): { error?: string; token?: string; email?: string } {
    const token = (req as any).query?.token;
    const email = (req as any).query?.email;
    return { token, email };
  }

  @Post("auth/reset-password")
  async reset(
    @Body() body: { email: string; token: string; password: string },
    @Res() res: Response
  ) {
    const { email, token, password } = body;
    const ok = await this.authService.resetPassword(email, token, password);
    if (!ok) {
      return res.render('auth/reset', { error: 'Token tidak valid atau sudah kadaluarsa', token, email });
    }

    return res.render('auth/login', { error: 'Password berhasil direset. Silakan login.' });
  }

  @Get("api/auth/starter-status")
  starterStatus(): { module: string; status: string; note: string } {
    return this.authService.starterStatus();
  }
}

