// src/ai/abstract/llm.service.ts
import { Injectable } from "@nestjs/common";
import { AIAuditStore } from "../../core/stores/monitoring/ai-audit/ai-audit.store";
import { LogStore } from "../../core/stores/monitoring/log/log.store";
import { LLMQueryParams, UnifiedMessage } from "../types/llm-query-params";
import { LLMResponse } from "../types/llm-response";

@Injectable()
export abstract class LLMServiceBase {
  constructor(
    protected readonly aiAuditStore: AIAuditStore,
    protected readonly logStore?: LogStore,
  ) {}

  /**
   * The model identifier used for audit records.
   */
  abstract get modelName(): string;

  /**
   * The core method implemented by GeminiService or OllamaService.
   */
  abstract query(params: LLMQueryParams): Promise<LLMResponse>;

  /**
   * Helper to standardize the "Assistant" message for the next turn.
   */
  protected createAssistantMessage(
    content: string,
    toolCalls?: any[],
  ): UnifiedMessage {
    return {
      role: "assistant",
      content,
      toolCalls,
    };
  }

  /**
   * Universal logging. Note: LLMResponse now includes latencyMs.
   */
  protected async logInteraction(
    params: LLMQueryParams,
    response: LLMResponse,
  ): Promise<void> {
    await this.aiAuditStore.create({
      userId: params.context.userId,
      chatSessionId: params.context.chatSessionId,
      userMessage: params.context.originalPrompt,
      toolCalls: response.toolCalls,
      finalResponse: response.content,
      durationMs: response.latencyMs,
      model: this.modelName,
      promptTokens: response.usage?.promptTokens,
      completionTokens: response.usage?.completionTokens,
      totalTokens: response.usage?.totalTokens,
      success: true,
    });
  }

  protected async logFailedInteraction(
    params: LLMQueryParams,
    error: Error,
    durationMs: number,
  ): Promise<void> {
    try {
      await this.aiAuditStore.create({
        userId: params.context.userId,
        chatSessionId: params.context.chatSessionId,
        userMessage: params.context.originalPrompt,
        finalResponse: error.message,
        durationMs,
        model: this.modelName,
        success: false,
      });
    } catch {
      // Swallow — don't let audit failures mask the original error
    }
  }
}
