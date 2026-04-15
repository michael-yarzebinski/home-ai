import { Injectable } from "@nestjs/common";
import { User } from "../users/user.domain";
import { Task } from "../tasks/task.domain";

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
  

@Injectable()
export class UserPermissionsService {

    checkPermission(user: User, task: Task): PermissionCheckResult {
        const requestRoles = parseRoleList(task.requestRoles);
        const executeRoles = parseRoleList(task.executeRoles);
    
        const canRequest = requestRoles.length > 0 && requestRoles.includes(user.role);
        const canExecute = user.role === 'admin' || (executeRoles.length > 0 && executeRoles.includes(user.role));
        const test = user.role === 'admin';
    
        return { canRequest, canExecute };
      }
}