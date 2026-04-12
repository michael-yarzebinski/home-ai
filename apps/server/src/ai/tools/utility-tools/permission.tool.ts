import { Injectable } from '@nestjs/common';
import { Task } from 'src/core/tasks/task.domain';
import { User } from 'src/core/users/user.domain';


export interface PermissionCheckResult {
  /** User’s role may initiate this task (see `request_roles` on the task). */
  canRequest: boolean;
  /** User’s role may run the task without a separate approver (see `execute_roles`). */
  canExecute: boolean;
}

function parseRoleList(csv?: string | null): string[] {
  if (!csv?.trim()) return [];
  return csv.split(',').map((r) => r.trim()).filter(Boolean);
}

/**
 * Role checks against `tasks.request_roles` and `tasks.execute_roles` (comma-separated lists).
 * Callers should load the task row (e.g. via {@link TasksService.findOne}) and ensure it is enabled
 * before invoking {@link PermissionTool.checkPermission}.
 */
@Injectable()
export class PermissionTool {
  async checkPermission(user: User, task: Task): Promise<PermissionCheckResult> {
    const requestRoles = parseRoleList(task.requestRoles);
    const executeRoles = parseRoleList(task.executeRoles);

    const canRequest = requestRoles.length > 0 && requestRoles.includes(user.role);
    const canExecute = user.role === 'admin' || (executeRoles.length > 0 && executeRoles.includes(user.role));
    const test = user.role === 'admin';

    return { canRequest, canExecute };
  }
}
