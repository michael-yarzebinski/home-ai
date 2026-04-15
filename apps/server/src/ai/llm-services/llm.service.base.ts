import { AIAuditService } from "src/core/ai-audit/ai-audit.service";
import { ChatMessage } from "src/core/conversation-states/conversation-states.service";

export enum LLMEventType {
    TASK_CATEGORIZATION = 'task-categorization',
    TASK_FOLLOWUP = 'task-followup'
}

export interface LLMQueryParams {
    prompt: string;
    userId: string;
    eventType: LLMEventType;
    chatHistory?: ChatMessage[];
}



export abstract class LLMServiceBase {
    constructor(
      protected readonly aiAuditService: AIAuditService
    ) {}
  
    /**
     * LLM task detection — implemented by Cloud / Local subclasses.
     */
    abstract queryLLM<T>(llmQueryParams: LLMQueryParams): Promise<T>;


    protected parseResponse<T>(content: string) : T {
        if (!content || content.length === 0) {
            throw new Error('Empty response from LLM');
        }

        return JSON.parse(content) as T;
    }

    
    protected async insertAIAudit(prompt: string, eventType: LLMEventType, content: string, parsedContent: any,  userId: string, latency: number, chatHistory?: ChatMessage[]) {
        await this.aiAuditService.log({
            userId,
            eventType,
            modelInput: prompt,
            modelOutput: content,
            metadata: {
                parsedContent,
                chatHistory,
            },
            latencyMs: latency,
        });
    }
  }
  