import { Controller, Get, Req, Res, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import * as crypto from 'crypto';
import { buildOAuthState, parseOAuthState } from './oauth-state.util';
import { GoogleAuthGuard } from './google-auth.guard';

@Controller('auth')
export class AuthController {
  usersService: any;
  constructor(private authService: AuthService) {}

  // GOOGLE LOGIN START
  @Get('google')
  googleAuth(@Query('returnTo') returnTo: string, @Res() res: Response) {
    const state = buildOAuthState(returnTo);

    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
    });

    //So, params is an instance of a URLSearchParams object.
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: 'http://shivani.local.com:3000/auth/google/callback',
      response_type: 'code',
      scope: 'email profile',
      prompt: 'select_account',
      // prompt: 'consent select_account',

      state,
    });

    return res.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    );
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const expectedState = req.cookies?.oauth_state;
    const returnedState = req.query?.state;

    // Validate state to prevent CSRF
    if (!expectedState || !returnedState || expectedState !== returnedState) {
      return res.redirect(
        `http://shivani.local.com:5173/login?error=invalid_oauth_state`,
      );
    }

    console.log('EXPECTED:', req.cookies?.oauth_state);
    console.log('RETURNED:', req.query?.state);

    res.clearCookie('oauth_state', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    // Parse state early to extract returnTo for error redirects
    const parsedState = parseOAuthState(returnedState as string);
    const returnTo = parsedState?.returnTo ?? '/taskboard';
    const baseErrorUrl = `http://shivani.local.com:5173/login?error=`;

    const error = req.query?.error;

    if (error === 'access_denied') {
      res.clearCookie('oauth_state');
      console.log('Google callback error:', error); // Add this line
      return res.redirect(
        `${baseErrorUrl}google_access_denied&returnTo=${encodeURIComponent(returnTo)}`,
      );
    }

    if (error) {
      res.clearCookie('oauth_state');
      return res.redirect(
        `http://shivani.local.com:5173/login?error=google_access_denied`,
      );
    }
    // Check if GoogleStrategy successfully authenticated
    const googleUser = req.user;
    if (!googleUser) {
      return res.redirect(
        `${baseErrorUrl}auth_failed&returnTo=${encodeURIComponent(returnTo)}`,
      );
    }

    const dbUser = await this.authService.validateOrCreateUser(googleUser);
    const accessToken = this.authService.generateAccessToken(dbUser);
    const refreshToken = this.authService.generateRefreshToken(dbUser);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(`http://shivani.local.com:5173${returnTo}`);
  }

  // GET CURRENT USER
  @Get('me')
@UseGuards(JwtAuthGuard)
async getMe(@Req() req) {
  return this.authService.findById(req.user.sub);
}

  @Get('ping')
  ping() {
    return {
      message: 'Hello from the auth service!',
      time: new Date().toISOString(),
    };
  }

  // REFRESH TOKEN
  @Get('refresh')
  async refresh(@Req() req, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    try {
      const payload = this.authService.verifyRefreshToken(refreshToken);

      const newAccessToken = this.authService.generateAccessToken({
        id: payload.sub,
        email: payload.email,
      });

      res.cookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      return res.json({ message: 'Token refreshed' });
    } catch (err) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  }

  // LOGOUT (FIXED PLACE)
  //   TypeScript Method Definition
  @Get('logout')
  logout(@Req() req, @Res() res: Response) {
    const cookieOptions = {
      httpOnly: true,
      secure: false,
      sameSite: 'lax' as const,
      path: '/',
    };

    // important: use res.clearCookie BEFORE response ends
    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
    console.log('COOKIES ON LOGOUT:', req.cookies);

    return res.status(200).json({ message: 'Logged out' });
  }
}
