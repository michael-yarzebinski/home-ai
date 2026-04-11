import { UserRecord } from '../../../modules/users/users.service';
import { TaskRecord } from '../../../modules/tasks/tasks.service';
import { PermissionCheckResult } from '../utility-tools/permission.tool';
import { DispatchResult } from './dispatch-result';

/**
 * Core request shape passed to ToolRouter.dispatch() and used throughout the AI pipeline.
 * Contains everything needed for permission checking, auditing, and execution.
 */
export interface DispatchRequest {
  /** Full task record from DB (for roles, schema, notify_roles, target etc) */
  task: TaskRecord;

  /** The user who requested/owns this action */
  user: UserRecord;

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

/** Re-export for convenience */
export type { DispatchResult } from './dispatch-result';
export type { ToolRequest } from './tool-request';
