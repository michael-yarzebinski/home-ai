import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SearchRequestDto, TaskRequestUpdateStatusDto } from '@home-ai/shared';
import { TaskRequestsService } from './task-requests.service';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { ValidationService } from '../../validation/validation.service';
import { toTaskRequestDto } from './task-request.mapper';

@Controller('admin/task-requests')
@Roles('admin')
export class TaskRequestAdminController {
  constructor(
    private readonly validationService: ValidationService,
    private readonly taskRequestsService: TaskRequestsService,
  ) {}

  @Post('search')
  async search(@Body() body: SearchRequestDto) {
    const searchRequest = await this.validationService.validateAndTransform(body, SearchRequestDto);
    return await this.taskRequestsService.search(searchRequest);
  }

  @Get('pending')
  async getPending() {
    const rows = await this.taskRequestsService.reader().findPendingApprovals();
    return rows.map((r) => toTaskRequestDto(r));
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const row = await this.taskRequestsService.reader().getById(id);
    return toTaskRequestDto(row);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: TaskRequestUpdateStatusDto) {
    const updateStatusDto = await this.validationService.validateAndTransform(body, TaskRequestUpdateStatusDto);
    const updated = await this.taskRequestsService.updateTaskRequest(id, {
      status: updateStatusDto.status,
      ...(updateStatusDto.executorUserId ? { executorUserId: updateStatusDto.executorUserId } : {}),
    });
    return toTaskRequestDto(updated);
  }
}
