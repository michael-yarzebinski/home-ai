export const TOOL_EXECUTION_EVENT_CHANNEL = "events:tool-execution";

export type ToolExecutionEventType = "tool-executed";

export type ApprovalAction = "requested" | "approved" | "rejected";

export interface ToolExecutionEvent {
  eventType: ToolExecutionEventType;
  // Actor that caused this event (requester, approver, or direct executor)
  userId: string;
  toolName: string;
  /** Parsed tool arguments (after schema validation). */
  argsSummary: unknown;
  /** Full tool handler / MCP result payload. */
  resultSummary?: unknown;
  approval?: {
    pendingActionReadableId: number;
    action: ApprovalAction;
  };
}
