import { Injectable } from '@nestjs/common';
import { TaskRequestStore } from './task-request.store';
import { TaskRequest } from './task-request.domain';

@Injectable()
export class TaskRequestsService {
  constructor(private readonly taskRequestStore: TaskRequestStore) {}

  reader(): Pick<
    TaskRequestStore,
    'findAll' | 'findById' | 'findOneBy' | 'findPendingApprovals' | 'findPendingDeviceEvents'
  > {
    return this.taskRequestStore;
  }

  async create(
    data: Omit<TaskRequest, 'requestId' | 'createdAt' | 'executedAt' | 'updatedAt'>,
  ): Promise<TaskRequest> {
    // The store's create() will handle auditing and defaults
    return this.taskRequestStore.create(data as any);
  }

  async findOne(request_id: number): Promise<TaskRequest | null> {
    return this.taskRequestStore.findByRequestId(request_id);
  }

  async findPendingApprovals(): Promise<TaskRequest[]> {
    return this.taskRequestStore.findPendingApprovals();
  }

  async updateStatus(request_id: number, status: string, executor_user_id?: string) {
    return this.taskRequestStore.update(request_id, {
      status,
      executorUserId: executor_user_id,
      executedAt: new Date(),
    });
  }

  async update(request_id: number, updates: Partial<TaskRequest>): Promise<TaskRequest | null> {
    try {
      return await this.taskRequestStore.update(request_id, updates);
    } catch {
      return null;
    }
  }

  async approve(request_id: number, approved_by_user_id: string): Promise<TaskRequest | null> {
    return this.update(request_id, {
      status: 'approved',
      approvedByUserId: approved_by_user_id,
      approvedAt: new Date(),
      requiresApproval: false,
    });
  }

  async markExecuted(request_id: number): Promise<TaskRequest | null> {
    return this.update(request_id, {
      status: 'executed',
      executedAt: new Date(),
    });
  }

  async queueForLater(request_id: number, scheduled_for: Date): Promise<TaskRequest | null> {
    return this.update(request_id, {
      quietHoursQueued: true,
      scheduledFor: scheduled_for,
      status: 'queued',
    });
  }

  async findPendingDeviceEvents(): Promise<TaskRequest[]> {
    return this.taskRequestStore.findPendingDeviceEvents();
  }
}