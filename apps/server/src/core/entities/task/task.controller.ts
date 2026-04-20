import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { SearchRequestDto } from '@home-ai/shared';
import { TasksService } from './tasks.service';
import { toTaskDto } from './task.mapper';
import { ValidationService } from '../../validation/validation.service';

@Controller('v1/tasks')
export class TaskController {
  constructor(
    private readonly validationService: ValidationService,
    private readonly tasksService: TasksService,
  ) {}

  @Post('search')
  async search(@Body() body: SearchRequestDto) {
    const searchRequest = await this.validationService.validateAndTransform(body, SearchRequestDto);
    searchRequest.includeInactive = false;
    return await this.tasksService.search(searchRequest);
  }

  @Get(':task_name')
  async getByTaskName(@Param('task_name') taskName: string) {
    const task = await this.tasksService.reader().getByTaskName(taskName);
    if (!task || task.active !== true) {
      throw new NotFoundException(`Task "${taskName}" not found`);
    }
    return toTaskDto(task);
  }
}
