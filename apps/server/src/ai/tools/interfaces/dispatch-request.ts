import { PermissionCheckResult } from '../utility-tools/permission.tool';
import { DispatchResult } from './dispatch-result';
import { Task } from 'src/core/tasks/task.domain';
import { User } from 'src/core/users/user.domain';

/**
 * Core request shape passed to ToolRouter.dispatch() and used throughout the AI pipeline.
 * Contains everything needed for permission checking, auditing, and execution.
 */
export interface DispatchRequest {
  /** Full task record from DB (for roles, schema, notify_roles, target etc) */
  task: Task;

  /** The user who requested/owns this action */
  user: User;

  /** Permission results from PermissionTool.checkPermission */
  permission: PermissionCheckResult;

  /** Parameters provided by the AI (or user) */
  parameters: Record<string, any>;

  /** How the task was triggered */
  sourceType: 'ai' | 'device_event' | 'manual';

  /** Optional chat context (very useful for iMessage flows) */
  chatGuid?: string;

  /** The ID of the task_request row (created by router) */
  taskRequestId?: number;

  /** Any additional metadata */
  metadata?: Record<string, any>;
}
