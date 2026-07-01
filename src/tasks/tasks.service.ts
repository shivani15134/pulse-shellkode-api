import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Task } from './entities/task.entity';
import { User } from '../users/user.entity';
import { StatusesService } from '../statuses/statuses.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Status } from '../statuses/entities/status.entity';

let status: Status | null = null;
@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly statusesService: StatusesService,
  ) {}

  private async generateTicketId(): Promise<string> {
    const lastTask = await this.taskRepository.find({
      order: {
        id: 'DESC',
      },
      take: 1,
    });

    const nextId = (lastTask[0]?.id || 0) + 1;

    return `TASK-${nextId}`;
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const ticketId = await this.generateTicketId();

    if (createTaskDto.statusId) {
      status = await this.statusesService.findById(createTaskDto.statusId);

      if (!status) {
        throw new NotFoundException('Status not found');
      }
    } else {
      status = await this.statusesService.findByName('To Do');

      if (!status) {
        throw new NotFoundException('Default status "To Do" not found');
      }
    }

    let assignee: User | null = null;

    let parent: Task | null = null;

    if (createTaskDto.parentId) {
      parent = await this.taskRepository.findOne({
        where: { id: createTaskDto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Parent task not found');
      }
    }

    if (createTaskDto.assigneeId) {
      const user = await this.userRepository.findOne({
        where: {
          id: createTaskDto.assigneeId,
        },
      });

      if (!user) {
        throw new NotFoundException('Assignee not found');
      }

      assignee = user;
    }

    console.log('Creating ticket:', ticketId);
    const task = this.taskRepository.create({
      ticketId,
      title: createTaskDto.title,
      type: createTaskDto.type ?? 'Task',
      priority: createTaskDto.priority ?? null,
      startDate: createTaskDto.startDate
        ? new Date(createTaskDto.startDate)
        : null,
      endDate: createTaskDto.endDate ? new Date(createTaskDto.endDate) : null,
      estimatedHours: createTaskDto.estimatedHours ?? null,
      spentHours: createTaskDto.spentHours ?? null,
      status: status,
      assignee,
      parent,
    });

    return this.taskRepository.save(task);
  }

  async findAll(filters: {
    // statusId?: number;
    statusId?: number[];
    assigneeId?: number;
    priority?: string[];
    type?: string[];
    search?: string;
  }) {
    console.log('findAll called');
    console.log(filters);

    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.status', 'status')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.subtasks', 'subtasks')
      .leftJoinAndSelect('subtasks.status', 'subtaskStatus')
      .leftJoinAndSelect('subtasks.assignee', 'subtaskAssignee')
      .where('task.parentId IS NULL');

    // if (filters.statusId) {
    //   query.andWhere('task.status_id = :statusId', {
    //     statusId: filters.statusId,
    //   });
    // }

    if (filters.statusId?.length) {
      query.andWhere('task.status_id IN (:...statusIds)', {
        statusIds: filters.statusId,
      });
    }

    if (filters.assigneeId) {
      query.andWhere('task.assignee_id = :assigneeId', {
        assigneeId: filters.assigneeId,
      });
    }

    if (filters.priority?.length) {
      query.andWhere('task.priority IN (:...priorities)', {
        priorities: filters.priority,
      });
    }

    if (filters.type?.length) {
      query.andWhere('task.type IN (:...types)', {
        types: filters.type,
      });
    }

    if (filters.assigneeId) {
      query.andWhere('assignee.id = :assigneeId', {
        assigneeId: filters.assigneeId,
      });
    }

    if (filters.search) {
      query.andWhere(
        '(task.ticketId ILIKE :search OR task.title ILIKE :search)',
        {
          search: `%${filters.search}%`,
        },
      );
    }

    const tasks = await query.orderBy('task.id', 'ASC').getMany();
    console.log('Takssssssssss');
    console.log(JSON.stringify(tasks, null, 2));

    return tasks;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: {
        status: true,
        assignee: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }
    console.log('updateTaskDto:', updateTaskDto);
    console.log('Before save:', task);

    if (updateTaskDto.title !== undefined) {
      task.title = updateTaskDto.title;
    }

    if (updateTaskDto.priority !== undefined) {
      task.priority = updateTaskDto.priority;
    }

    if (updateTaskDto.statusId !== undefined) {
      const status = await this.statusesService.findById(
        updateTaskDto.statusId,
      );

      if (!status) {
        throw new NotFoundException('Status not found');
      }

      task.status = status;
    }

    // if (updateTaskDto.assigneeId !== undefined) {
    //   const assignee = await this.userRepository.findOne({
    //     where: {
    //       id: updateTaskDto.assigneeId,
    //     },
    //   });

    //   task.assignee = assignee ?? null;
    // }

    task.assignee = {
      id: updateTaskDto.assigneeId,
    } as User;

    if (updateTaskDto.startDate !== undefined) {
      task.startDate = updateTaskDto.startDate
        ? new Date(updateTaskDto.startDate)
        : null;
    }

    if (updateTaskDto.endDate !== undefined) {
      task.endDate = updateTaskDto.endDate
        ? new Date(updateTaskDto.endDate)
        : null;
    }

    if (updateTaskDto.estimatedHours !== undefined) {
      task.estimatedHours = updateTaskDto.estimatedHours;
    }

    if (updateTaskDto.spentHours !== undefined) {
      task.spentHours = updateTaskDto.spentHours;
    }

    return this.taskRepository.save(task);
  }

  async remove(id: number): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.taskRepository.remove(task);
  }
}
