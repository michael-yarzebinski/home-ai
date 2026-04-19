import { LLMAction } from "src/ai/llm.dtos";

export type TaskDecision = {
  action: LLMAction.CLARIFY,
  clarifyingQuestion: string;
  pendingParameters: Record<string, any>
} |
{
  action: LLMAction.EXECUTE;
  taskName: string;
  parameters: Record<string, any>;
} |
{
  action: LLMAction.UNSUPPORTED;
};
