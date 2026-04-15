import { TaskRequest } from "src/core/task-requests/task-request.domain";
import { ToolResult } from "./tool-result";

/**
 * Standardized result returned by tools and the ToolRouter.
 * Used by AIToolsServiceBase to construct the final response to the user.
 */
export interface DispatchResult extends ToolResult {
  taskRequest?: TaskRequest;
  notify?: boolean;
}
