/**
 * SECURITY INVARIANT:
 * Every tool execution MUST go through a task_request record.
 * Tools are never executed directly from AI output or anywhere else.
 * The ToolRouter is the only place that creates task_requests and then calls tools.
 */

import type { ToolRequest } from "./interfaces/tool-request";
import type { ToolResult } from "./interfaces/tool-result";

export abstract class ToolBase {
  /**
   * List of task names this tool can handle.
   * Strongly prefer 1:1 mapping (e.g. ['add_device']) for clarity and maintainability.
   * Multiple names are allowed when it truly makes sense.
   */
  abstract readonly taskNames: readonly string[];

  /**
   * Determines whether this tool should handle the given taskName.
   * Each concrete tool MUST implement this (no default). Supports 1:1 task-to-tool
   * mapping and complex matching (e.g. startsWith for variants).
   */
  abstract canHandle(taskName: string): boolean;

  /**
   * Execute the tool's logic.
   *
   * @param request - Full dispatch context (includes taskRequestId, task record, user, permissions, parameters).
   *                  This guarantees audit trail, permissions, and status tracking.
   * @returns Standardized result; notify flag tells service base whether to send notifications.
   */
  abstract execute(request: ToolRequest): Promise<ToolResult>;
}