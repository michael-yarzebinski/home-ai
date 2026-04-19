import { Injectable } from '@nestjs/common';
import { TaskRequestStore } from './task-request.store';
import { TaskRequest } from './task-request.domain';

@Injectable()
export class TaskRequestsService {
  constructor(private readonly taskRequestStore: TaskRequestStore) {}

  reader(): Pick<TaskRequestStore, 'getAll' | 'getAllActive' | 'getById' | 'getByReadableId' | 'findPendingApprovals'> {
    return this.taskRequestStore;
  }

  async createTaskRequest(data: Omit<TaskRequest, 'id' | 'readableId' | 'createdAt' | 'updatedAt'>): Promise<TaskRequest> {
    // Generate readable_id (simple auto-increment via DB or sequence)
    // For now we let PostgreSQL handle it via bigIncrements in schema
    return this.taskRequestStore.create({
      ...data,
      readableId: 0,               // Will be overwritten by DB
      status: data.status ?? 'pending',
      requiresApproval: data.requiresApproval ?? false,
      quietHoursQueued: data.quietHoursQueued ?? false,
    });
  }

  async updateTaskRequest(id: string, updates: Partial<TaskRequest>): Promise<TaskRequest> {
    return this.taskRequestStore.update(id, updates);
  }

  async approveTaskRequest(id: string, userId: string): Promise<TaskRequest> {
    return await this.updateTaskRequest(id, {
      approvedByUserId: userId,
      approvedAt: new Date(),
    })
  }

  async rejectTaskRequest(id: string): Promise<TaskRequest> {
    return await this.updateTaskRequest(id, {
      status: 'rejected',
    });
  }
}