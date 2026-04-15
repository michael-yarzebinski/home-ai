import { TaskRequest } from 'src/core/task-requests/task-request.domain';
import { DispatchRequest } from './dispatch-request';

/**
 * Context passed to ToolBase.execute().
 * Combines the core dispatch request with the taskRequestId created by the router.
 */
export interface ToolRequest {
  dispatchRequest: DispatchRequest;
  taskRequest: TaskRequest
}
