import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class AdminSessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { session?: { adminUserId?: string } }>();
    const res = context.switchToHttp().getResponse<Response>();
    if (req.session && req.session.adminUserId) {
      return true;
    }
    // If not logged in, redirect to login page
    if (res) {
      res.redirect('/auth/login');
    }
    return false;
  }
}
