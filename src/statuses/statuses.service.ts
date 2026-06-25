import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from './entities/status.entity';

@Injectable()
export class StatusesService implements OnModuleInit {
  constructor(
    @InjectRepository(Status)
    private readonly statusRepository: Repository<Status>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultStatuses();
  }

  async seedDefaultStatuses(): Promise<void> {
    const defaultStatuses = [
      {
        name: 'To Do',
      },
      {
        name: 'In Progress',
      },
      {
        name: 'Done',
      },
    ];

    for (const status of defaultStatuses) {
      const existingStatus = await this.statusRepository.findOne({
        where: {
          name: status.name,
        },
      });

      if (!existingStatus) {
        await this.statusRepository.save(status);
      }
    }
  }

  async findByName(name: string): Promise<Status | null> {
    return this.statusRepository.findOne({
      where: {
        name,
      },
    });
  }

  async findById(id: number) {
  return this.statusRepository.findOne({
    where: { id },
  });
}
}