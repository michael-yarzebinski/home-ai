// src/tools/types/tool-context.ts
import { Role } from "@home-ai/shared/domain/role/role";

export interface ToolContext {
  /** * Identity: Who is triggering the action?
   * Essential for database ownership and RBAC checks within the tool.
   */
  userId: string;
  userRole: Role;
  userName: string;

  /** * Session: Where does this action live?
   * Used for auditing, message threading, and "Inception" sub-calls.
   */
  chatSessionId?: string;

  /** * Temporal: When is this happening?
   * Tools like "schedule-reminder" or "get-weather" need the user's local time.
   */
  currentISO: string;
  timezone: string;

  /** * Environmental: Where is the request coming from?
   * Allows Phil to be room-aware (e.g., "Turn on the lights").
   */
  location?: {
    room?: string;
    coordinates?: string;
  };

  /** * Operational: How should the tool behave?
   * Injected from user settings (e.g., standardizing ingredients to 'metric').
   */
  preferences: {
    units: "metric" | "imperial";
    verbosity: "concise" | "detailed";
  };

  /** * LLM Metadata: Traceability back to the original intent.
   */
  llmContext: {
    originalPrompt: string;
  };

  /** * Extensibility: For tool-specific dynamic data.
   */
  [key: string]: any;
}
