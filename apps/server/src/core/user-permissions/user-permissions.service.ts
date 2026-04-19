import { Injectable } from "@nestjs/common";
import { User } from "../entities/user/user.domain";
import { Task } from "../entities/task/task.domain";

export interface PermissionCheckResult {
    /** User’s role may initiate this task (see `request_roles` on the task). */
    canRequest: boolean;
    /** User’s role may run the task without a separate approver (see `execute_roles`). */
    canExecute: boolean;
  }
  
@Injectable()
export class UserPermissionsService {

    checkPermission(user: User, task: Task): PermissionCheckResult {    
        const canRequest = task.requestRoles.length > 0 && task.requestRoles.includes(user.role);
        const canExecute = user.role === 'admin' || (task.executeRoles.length > 0 && task.executeRoles.includes(user.role));
    
        return { canRequest, canExecute };
      }
}