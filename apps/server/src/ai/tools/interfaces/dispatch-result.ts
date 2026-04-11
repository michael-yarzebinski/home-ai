/**
 * Standardized result returned by tools and the ToolRouter.
 * Used by AIToolsServiceBase to construct the final response to the user.
 */
export interface DispatchResult {
  success: boolean;
  message: string;
  reply?: string;
  data?: unknown;
  notify?: boolean;
  taskRequestId?: number;
}
