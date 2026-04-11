export interface ModelDecision {
  action: 'execute_task' | 'clarify' | 'update_fact' | 'summary' | 'noop' | 'error';
  task_name?: string | null;
  parameters?: Record<string, any>;
  clarification_question?: string | null;
  pending_parameters?: Record<string, any>;
  conversation_summary?: string | null;
}
