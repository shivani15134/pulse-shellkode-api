import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async findOrCreateGoogleUser(googleUser: {
    email: string;
    name: string;
    googleId: string;
    picture?: string;
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
        picture: googleUser.picture,
      });

      //   Insert the new user into the database and return the saved user with an id
      await this.userRepo.save(user);
    } else {
      // Update the picture if it's changed or missing
      user.picture = googleUser.picture;
      await this.userRepo.save(user);
    }
    console.log(user);

    return user;
  }

  async findAll() {
    return this.userRepo.find({
      order: {
        name: 'ASC',
      },
    });
  }

  async findById(id: number) {
  return this.userRepo.findOne({
    where: { id },
  });
}
}



// @InjectRepository(User)- Give me access to the User table
