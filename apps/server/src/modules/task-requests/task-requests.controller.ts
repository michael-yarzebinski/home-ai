import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { TaskRequestsService } from './task-requests.service';

@Controller('admin/task-requests')
export class TaskRequestsController {
  constructor(private readonly taskRequestsService: TaskRequestsService) {}

  @Get()
  async findAll() {
    return this.taskRequestsService.findPendingApprovals();
  }

  @Get('pending')
  async getPending() {
    return this.taskRequestsService.findPendingApprovals();
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; executor_user_id?: string }
  ) {
    return this.taskRequestsService.updateStatus(
      parseInt(id),
      body.status,
      body.executor_user_id
    );
  }
}