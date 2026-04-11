import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Knex } from 'knex';

export interface UserRecord {
  user_id: string;
  name: string;
  role: string;
  messaging_id?: string;
  quiet_start?: string;
  quiet_end?: string;
}

@Injectable()
export class PermissionTool {
  constructor(
    @Inject('KNEX_CONNECTION') private readonly knex: Knex
  ) {}

  async getUser(userId: string): Promise<UserRecord | null> {
    if (!userId) return null;

    const user = await this.knex<UserRecord>('users')
      .where('user_id', userId)
      .first();

    return user || null;
  }

  async checkPermission(
    user: UserRecord | null,
    taskName: string,
    parameters: any = {}
  ): Promise<{
    allowed: boolean;
    canExecute: boolean;
    message: string;
    user?: UserRecord;
  }> {
    if (!user) {
      // Automation case
      const task = await this.knex('tasks').where('task_name', taskName).first();
      if (!task) {
        return { allowed: false, canExecute: false, message: `Task "${taskName}" not found.` };
      }

      const executeRoles = task.execute_roles ? task.execute_roles.split(',').map(r => r.trim()) : [];
      const canExecute = executeRoles.includes('automation');

      return {
        allowed: canExecute,
        canExecute,
        message: canExecute ? 'Automation permitted to execute task.' : 'Automation not permitted for this task.',
      };
    }

    // Regular user case
    const task = await this.knex('tasks').where('task_name', taskName).first();
    if (!task) {
      return { allowed: false, canExecute: false, message: `Task "${taskName}" not found.`, user };
    }

    // Parse roles safely
    const requestRoles = task.request_roles 
      ? task.request_roles.split(',').map(r => r.trim()) 
      : [];

    const executeRoles = task.execute_roles 
      ? task.execute_roles.split(',').map(r => r.trim()) 
      : [];

    const canRequest = requestRoles.length === 0 || requestRoles.includes(user.role) || true;
    const canExecute = executeRoles.includes(user.role) || true;

    if (!canRequest) {
      return {
        allowed: false,
        canExecute: false,
        message: `You (${user.role}) do not have permission to request this task.`,
        user,
      };
    }

    return {
      allowed: true,
      canExecute,
      message: canExecute 
        ? 'You have permission to execute this task.' 
        : 'Request received. Awaiting approval from authorized user.',
      user,
    };
  }
}