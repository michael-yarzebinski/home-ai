// src/ai/types/llm-query-params.ts
import { z } from "zod";

export type MessageRole = "system" | "user" | "assistant" | "tool";

export interface UnifiedMessage {
  role: MessageRole;
  content: string;
  name?: string;
  // Used for 'assistant' role when the LLM wants to call a tool
  toolCalls?: UnifiedToolCall[];
  // Used for 'tool' role to provide the result back to the LLM
  toolCallId?: string;
  // 2026 Standard: For Gemini 3.1+ reasoning chains
  thoughtSignature?: string;
  isError?: boolean;
}

export interface UnifiedToolCall {
  id: string;
  name: string;
  args: any;
}

export interface LLMToolDefinition {
  name: string;
  description: string;
  // This is the Zod Shape we get from handler.parameters.shape
  inputSchema: any;
}

export interface LLMQueryParams {
  messages: UnifiedMessage[];
  tools?: LLMToolDefinition[];
  jsonMode?: boolean;
  context: {
    userId: string;
    chatSessionId?: string;
    originalPrompt: string;
  };
}
