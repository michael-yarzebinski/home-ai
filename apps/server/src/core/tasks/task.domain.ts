/**
 * Domain model for Task entity (business logic shape).
 * Uses camelCase properties for consistency with TypeScript and the rest of the app.
 * Only includes fields that exist in the tasks table schema (from initial_schema.ts and seeds).
 *
 * This enables strongly typed task parameters in the next phase of AI tool integration.
 */
export interface Task {
  taskName: string;
  description: string;
  requestRoles?: string | null;
  executeRoles: string;
  notifyRoles?: string | null;
  actionType: string;
  parametersSchema?: any; // JSON schema for LLM parameter extraction
  target?: string | null;
  enabled: boolean;
}

/**
 * Partial for updates (all fields optional).
 */
export type TaskUpdate = Partial<Task>;
