import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';

export interface TaskRequestRecord {
  request_id: number;
  task_name: string;
  requester_user_id?: string | null;
  executor_user_id?: string | null;
  parameters: Record<string, any>;
  raw_message?: string | null;
  attachments?: any;
  status: string;

  // Device fields
  source_type: string;
  device_id_slug?: string | null;
  event_type?: string | null;
  device_metadata?: Record<string, any> | null;

  // Approval & quiet hours
  requires_approval: boolean;
  approved_by_user_id?: string | null;
  approved_at?: Date | null;
  quiet_hours_queued: boolean;
  scheduled_for?: Date | null;

  created_at: Date;
  executed_at?: Date | null;
  updated_at?: Date | null;
  notes?: string | null;
}

@Injectable()
export class TaskRequestsService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async create(data: Omit<TaskRequestRecord, 'request_id' | 'created_at' | 'executed_at' | 'updated_at'>): Promise<TaskRequestRecord> {
    const [request] = await this.knex('task_requests')
      .insert({
        ...data,
        status: data.status || 'pending',
        requires_approval: data.requires_approval ?? false,
        quiet_hours_queued: data.quiet_hours_queued ?? false,
      })
      .returning('*');

    return request;
  }

  async findOne(request_id: number): Promise<TaskRequestRecord | null> {
    return this.knex('task_requests')
      .where('request_id', request_id)
      .first<TaskRequestRecord>();
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

  /**
   * General update method - avoids Raw type issues by not passing knex.fn.now() directly in TypeScript
   */
  async update(request_id: number, updates: Partial<TaskRequestRecord>): Promise<TaskRequestRecord | null> {
    const updatePayload: any = { ...updates };

    // Let Knex handle timestamps automatically where possible
    const [request] = await this.knex('task_requests')
      .where('request_id', request_id)
      .update(updatePayload)
      .returning('*');

    return request || null;
  }

  async approve(request_id: number, approved_by_user_id: string): Promise<TaskRequestRecord | null> {
    return this.update(request_id, {
      status: 'approved',
      approved_by_user_id,
      approved_at: new Date(),           // Use plain JS Date instead of knex.fn.now()
      requires_approval: false,
    });
  }

  async markExecuted(request_id: number): Promise<TaskRequestRecord | null> {
    return this.update(request_id, {
      status: 'executed',
      executed_at: new Date(),
    });
  }

  async queueForLater(request_id: number, scheduled_for: Date): Promise<TaskRequestRecord | null> {
    return this.update(request_id, {
      quiet_hours_queued: true,
      scheduled_for,
      status: 'queued',
    });
  }

  async findPendingDeviceEvents(): Promise<TaskRequestRecord[]> {
    return this.knex('task_requests')
      .where('source_type', 'device')
      .where('status', 'pending')
      .orderBy('created_at');
  }
}