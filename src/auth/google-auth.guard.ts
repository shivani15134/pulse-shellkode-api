// google-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  handleRequest(err, user, info, context: ExecutionContext) {
    const res = context.switchToHttp().getResponse();

    if (err || !user) {
      // redirect to frontend with friendly error instead of throwing
      return res.redirect('http://shivani.local.com:5173/login?error=google_access_denied');
    }

    return user; // continue normally
  }
}