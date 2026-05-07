import { Injectable } from "@nestjs/common";
import OpenAI from "openai";
import { LLMServiceBase } from "../../abstract/llm.service.base";
import {
  LLMQueryParams,
  UnifiedMessage,
  UnifiedToolCall,
} from "../../types/llm-query-params";
import { LLMResponse } from "../../types/llm-response";
import { AIAuditStore } from "../../../core/stores/monitoring/ai-audit/ai-audit.store";

@Injectable()
export class OpenAILLMService extends LLMServiceBase {
  private client: OpenAI;
  private model: string;

  constructor(
    protected readonly aiAuditStore: AIAuditStore,
    private readonly modelConfig: {
      model: string;
      baseURL: string;
      apiKey: string;
    },
  ) {
    super(aiAuditStore);

    this.model = modelConfig.model;
    this.client = new OpenAI({
      apiKey: modelConfig.apiKey,
      baseURL: modelConfig.baseURL,
    });
  }

  async query(params: LLMQueryParams): Promise<LLMResponse> {
    const startTime = Date.now();

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: params.messages.map((msg) => this.mapMessageToOpenAI(msg)),
      tools: params.tools ? this.mapToolsToOpenAI(params.tools) : undefined,
      response_format: params.jsonMode ? { type: "json_object" } : undefined,
      max_tokens: 4096, // Increase this!
      temperature: 0.2,
    });

    const latencyMs = Date.now() - startTime;
    const choice = response.choices[0];

    const finalResponse: LLMResponse = {
      content: choice.message.content || "",
      toolCalls: this.mapToolCalls(choice.message.tool_calls),
      latencyMs,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };

    // Log for Audit
    await this.logInteraction(params, finalResponse);

    return finalResponse;
  }

  /**
   * Maps UnifiedMessage to OpenAI/Nvidia format
   */
  private mapMessageToOpenAI(msg: UnifiedMessage): any {
    if (msg.role === "tool") {
      return {
        role: "tool",
        tool_call_id: msg.toolCallId,
        content:
          typeof msg.content === "string"
            ? msg.content
            : JSON.stringify(msg.content),
      };
    }

    return {
      role: msg.role,
      content: msg.content,
      tool_calls: msg.toolCalls?.map((tc) => ({
        id: tc.id,
        type: "function",
        function: {
          name: tc.name,
          arguments: JSON.stringify(tc.args),
        },
      })),
    };
  }

  /**
   * Maps our Tool definitions to OpenAI Tool format
   */
  private mapToolsToOpenAI(tools: any[]): any[] {
    return tools.map((tool) => {
      const properties: any = {};
      const required: string[] = [];

      for (const [key, zodValue] of Object.entries(tool.inputSchema)) {
        const val = zodValue as any;

        // 1. Determine the actual type, unwrapping Optionals
        let zType = val._def.typeName;
        if (zType === "ZodOptional") {
          // Look at the inner type instead
          zType = val._def.innerType._def.typeName;
        } else {
          // If it's NOT optional, add it to the required array
          required.push(key);
        }

        // 2. Map Zod types to valid JSON Schema types
        let jsonType = "string"; // Default
        if (zType === "ZodNumber") jsonType = "number";
        if (zType === "ZodBoolean") jsonType = "boolean";
        if (zType === "ZodArray") jsonType = "array";
        if (zType === "ZodObject") jsonType = "object";

        properties[key] = {
          type: jsonType,
          description: val.description || "",
        };
      }

      return {
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: {
            type: "object",
            properties,
            required, // Only include non-optional keys
          },
        },
      };
    });
  }

  /**
   * Converts OpenAI tool calls back to UnifiedToolCall format
   */
  private mapToolCalls(
    toolCalls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
  ): UnifiedToolCall[] | undefined {
    if (!toolCalls) return undefined;

    return toolCalls
      .filter((tc) => tc.type === "function")
      .map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        args: JSON.parse(tc.function.arguments),
      }));
  }
}
