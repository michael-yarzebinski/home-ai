import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SearchRequestDto } from '@home-ai/shared';
import { TaskRequestsService } from './task-requests.service';
import { ValidationService } from '../../validation/validation.service';
import { toTaskRequestDto } from './task-request.mapper';

@Controller('v1/task-requests')
export class TaskRequestController {
  constructor(
    private readonly validationService: ValidationService,
    private readonly taskRequestsService: TaskRequestsService,
  ) {}

  @Post('search')
  async search(@Body() body: SearchRequestDto) {
    const searchRequest = await this.validationService.validateAndTransform(body, SearchRequestDto);
    searchRequest.includeInactive = false;
    return await this.taskRequestsService.search(searchRequest);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const row = await this.taskRequestsService.reader().getById(id);
    return toTaskRequestDto(row);
  }
}
