import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { AiToolsService } from '../../tools/ai-tools.service';

@Injectable()
export class TaskRequestsService {
  constructor(
    @Inject('KNEX_CONNECTION') private readonly knex: Knex,
    private readonly aiToolsService: AiToolsService,
  ) {}

  async createRequest(data: {
    task_name: string;
    requester_user_id?: string;
    parameters: any;
    raw_message: string;
    status: string;
  }) {
    const [request] = await this.knex('task_requests')
      .insert({
        task_name: data.task_name,
        requester_user_id: data.requester_user_id,
        parameters: data.parameters,
        raw_message: data.raw_message,
        status: data.status,
      })
      .returning('*');

    return request;
  }

  async findPendingApprovals() {
    return this.knex('task_requests')
      .where('status', 'awaiting_approval')
      .orderBy('created_at', 'desc');
  }

  async updateStatus(request_id: number, status: string, executor_user_id?: string) {
    return this.knex('task_requests')
      .where('request_id', request_id)
      .update({
        status,
        executor_user_id,
        executed_at: this.knex.fn.now(),
      })
      .returning('*');
  }
}