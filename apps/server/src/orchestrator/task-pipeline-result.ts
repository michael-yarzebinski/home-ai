/** Shared orchestration outcome type (kept out of `ai-orchestrator.service` to avoid import cycles). */
export interface TaskPipelineResult {
  response: string;
  status: string;
}
