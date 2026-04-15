export enum AIAction {
  EXECUTE = 'execute',
  CLARIFY = 'clarify'
}

export type TaskDecision = {
  action: AIAction.CLARIFY,
  response: string;
  pendingParameters: Record<string, any>
} |
{
  action: 'execute';
  taskName: string;
  parameters: Record<string, any>;
};
