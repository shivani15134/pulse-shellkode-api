import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  generateAccessToken(user: any) {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
      },
      {
        expiresIn: '10m',
      },
    );
  }

  generateRefreshToken(user: any) {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
      },
      {
        expiresIn: '7d',
      },
    );
  }
  async validateOrCreateUser(googleUser: {
    email: string;
    name: string;
    googleId: string;
    picture?: string;
  }) {
    return this.usersService.findOrCreateGoogleUser(googleUser);
  }

  verifyRefreshToken(token: string) {
    return this.jwtService.verify(token);
  }

  async findById(id: number) {
  return this.usersService.findById(id);
}
}
