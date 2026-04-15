import { Task } from 'src/core/tasks/task.domain';
import { User } from 'src/core/users/user.domain';
import { ChatMessage } from 'src/core/conversation-states/conversation-states.service';
import { PermissionCheckResult } from 'src/core/user-permissions/user-permissions.service';

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

  chatHistory: ChatMessage[];

  /** Any additional metadata */
  metadata?: Record<string, any>;
}
