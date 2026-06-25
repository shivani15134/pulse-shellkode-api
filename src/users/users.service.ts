import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async findOrCreateGoogleUser(googleUser: {email: string; name: string; googleId: string}) {
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

	//   Insert the new user into the database and return the saved user with an id
    await this.userRepo.save(user);
    }

    return user;
  }

  async findAll() {
  return this.userRepo.find({
    order: {
      name: 'ASC',
    },
  });
}
}


// @InjectRepository(User)- Give me access to the User table
