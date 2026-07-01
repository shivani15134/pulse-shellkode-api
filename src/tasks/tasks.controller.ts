import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Delete,
} from '@nestjs/common';

import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto) {
    const task = await this.tasksService.create(createTaskDto);
	 console.log("DTO:", createTaskDto);

    return {
      success: true,
      message: 'Task created successfully',
      data: task,
    };
  }

  @Get()
  async findAll(
    @Query('statusId') statusId?: string | string[],
    // @Query('statusId') statusId?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('priority') priority?: string | string[],
    @Query('type') type?: string | string[],
    @Query('search') search?: string,
  ) {
    console.log('statusId:', statusId);
    console.log('priority:', priority);
    console.log('type:', type);
    const tasks = await this.tasksService.findAll({
      //   statusId: statusId ? Number(statusId) : undefined,
      statusId: statusId
        ? Array.isArray(statusId)
          ? statusId.map(Number)
          : [Number(statusId)]
        : undefined,
      assigneeId: assigneeId ? Number(assigneeId) : undefined,
      priority: priority
        ? Array.isArray(priority)
          ? priority
          : [priority]
        : undefined,
      type: type ? (Array.isArray(type) ? type : [type]) : undefined,
      search,
    });

    return {
      success: true,
      data: tasks,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    const task = await this.tasksService.update(Number(id), updateTaskDto);

    return {
      success: true,
      message: 'Task updated successfully',
      data: task,
    };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(+id);
  }
}
