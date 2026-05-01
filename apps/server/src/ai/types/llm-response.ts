// src/ai/types/llm-response.ts

import { UnifiedMessageMetadata, UnifiedToolCall } from "./llm-query-params";

export interface LLMResponse {
  content: string;
  toolCalls?: UnifiedToolCall[];
  // Track how long it took for auditing
  latencyMs: number;
  // Information for the AuditStore
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: UnifiedMessageMetadata;
}