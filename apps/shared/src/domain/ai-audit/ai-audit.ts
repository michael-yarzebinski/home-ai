import { Insertable } from '../helper/crud.helper';

export interface AIAudit {
  id: string;
  userId: string;
  chatSessionId?: string;
  userMessage: string;
  toolCalls?: any;
  finalResponse?: string;
  durationMs?: number;
  success: boolean;
  createdAt: Date;
}
export type InsertableAIAudit = Insertable<AIAudit>;
