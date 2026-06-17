import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findOrCreateGoogleUser(googleUser: {
    email: string;
    name: string;
    googleId: string;
  }) {
    // 1. check if user exists
    let user = await this.userRepo.findOne({
      where: { email: googleUser.email },
    });

    // 2. if not, create user
    if (!user) {
      user = this.userRepo.create({
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.googleId,
      });

      await this.userRepo.save(user);
    }

    return user;
  }
}