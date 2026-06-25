import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService], 
})
export class UsersModule {}









// Module = box of related things
// imports- Inside this module, I want access to the User table.
// providers- Inside this module, I want to be able to use the UsersService class to do things like create users, find users, etc.
// exports- I want other modules (like AuthModule) to be able to use the UsersService class to do things like create users, find users, etc.