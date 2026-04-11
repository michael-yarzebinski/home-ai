import { DispatchRequest } from './dispatch-request';
import type { DispatchResult } from './dispatch-result';

/**
 * Context passed to ToolBase.execute().
 * Combines the core dispatch request with the taskRequestId created by the router.
 */
export interface ToolRequest {
  request: DispatchRequest;
  taskRequestId: number;
}
