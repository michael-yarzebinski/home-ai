import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { TaskRequestsService } from './task-requests.service';

@Controller('admin/task-requests')
export class TaskRequestsController {
  constructor(private readonly taskRequestsService: TaskRequestsService) {}

  @Get()
  async getAll() {
    return this.taskRequestsService.reader().getAll();
  }

  @Get('pending')
  async getPending() {
    return this.taskRequestsService.reader().findPendingApprovals;
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; executor_user_id?: string }
  ) {
    return this.taskRequestsService.updateTaskRequest(
      id,
      {
        status: body.status
      }
    );
  }
}