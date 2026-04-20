import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { SearchRequestDto, SetActiveDto, TaskUpdateDto } from '@home-ai/shared';
import { TasksService } from './tasks.service';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { fromTaskUpdateDto, toTaskDto } from './task.mapper';
import { ValidationService } from '../../validation/validation.service';

@Controller('admin/tasks')
@Roles('admin')
export class TaskAdminController {
  constructor(
    private readonly validationService: ValidationService,
    private readonly tasksService: TasksService,
  ) {}

  @Post('search')
  async search(@Body() body: SearchRequestDto) {
    const searchRequest = await this.validationService.validateAndTransform(body, SearchRequestDto);
    return await this.tasksService.search(searchRequest);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const task = await this.tasksService.reader().getById(id, true);
    if (!task) {
      throw new NotFoundException(`Task "${id}" not found`);
    }
    return toTaskDto(task);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updates: TaskUpdateDto) {
    const task = await this.tasksService.updateTask(id, fromTaskUpdateDto(updates));
    if (!task) {
      throw new NotFoundException(`Task "${id}" not found`);
    }
    return toTaskDto(task);
  }

  @Patch(':id/active')
  async setActive(@Param('id') id: string, @Body() body: SetActiveDto) {
    const task = await this.tasksService.setTaskActive(id, body.active);
    return toTaskDto(task);
  }
}
