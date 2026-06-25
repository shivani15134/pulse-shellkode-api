import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  handleRequest(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ) {
    const req = context.switchToHttp().getRequest();

    if (req.query?.error === 'access_denied') {
      return null;
    }

    if (err) {
      throw err;
    }

    if (!user) {
      throw new UnauthorizedException('Google authentication failed');
    }

    return user;
  }
}