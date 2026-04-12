import { Controller, Get, Patch, Param, Body, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('admin/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async findAll() {
    return this.tasksService.findAll();
  }

  @Get(':task_name')
  async findOne(@Param('task_name') task_name: string) {
    const task = await this.tasksService.findOne(task_name);
    if (!task) {
      throw new NotFoundException(`Task "${task_name}" not found`);
    }
    return task;
  }

  @Patch(':task_name')
  async update(@Param('task_name') task_name: string, @Body() updates: any) {
    const task = await this.tasksService.updateTask(task_name, updates);
    if (!task) {
      throw new NotFoundException(`Task "${task_name}" not found`);
    }
    return task;
  }
}