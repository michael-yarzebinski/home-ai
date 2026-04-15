export interface ToolResult {
    success: boolean;
    reply: string;
    data?: any;                         // Optional structured data for the orchestrator
    clarificationNeeded?: boolean;      // Flag if the tool needs more info from user
    clarificationQuestion?: string;     // Optional suggested question for the user
    metadata?: Record<string, any>;     // For extra context (e.g., resolved device, cost, etc.)
    taskRequestId?: string;             // Pass through, don't update here
}
