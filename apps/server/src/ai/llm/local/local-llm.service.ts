import { Injectable } from "@nestjs/common";
import { LLMServiceBase } from "../../abstract/llm.service.base";
import { LLMQueryParams, UnifiedToolCall } from "../../types/llm-query-params";
import { LLMResponse } from "../../types/llm-response";
import { AIAuditStore } from "../../../core/stores/monitoring/ai-audit/ai-audit.store";
import { LogStore } from "../../../core/stores/monitoring/log/log.store";
import { Trace } from "../../../common/decorators/trace.decorator";
import OpenAI from "openai";

@Injectable()
export class LocalLLMService extends LLMServiceBase {
  private openai: OpenAI;
  private model: string;

  get modelName(): string {
    return this.model;
  }

  constructor(
    protected readonly aiAuditStore: AIAuditStore,
    protected readonly logStore: LogStore,
    private readonly modelConfig: {
      model: string;
      baseURL: string;
    },
  ) {
    super(aiAuditStore, logStore);

    this.model = modelConfig.model;
    this.openai = new OpenAI({
      baseURL: modelConfig.baseURL,
      apiKey: "ollama",
    });
  }

  @Trace()
  async query(params: LLMQueryParams): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
    return await this._query(params, startTime);
    } catch (error: any) {
      await this.logFailedInteraction(params, error, Date.now() - startTime);
      throw error;
    }
  }

  private async _query(params: LLMQueryParams, startTime: number): Promise<LLMResponse> {
    const tools: OpenAI.Chat.ChatCompletionTool[] =
      params.tools?.map((tool) => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: this.mapZodShapeToJsonSchema(tool.inputSchema),
        },
      })) || [];

    const messages = params.messages.map((msg) => this.mapToOpenAiMessage(msg));

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: messages as any,
      tools: tools.length > 0 ? tools : undefined,
      response_format: params.jsonMode
        ? { type: "json_object" }
        : { type: "text" },
      stream: false,
      extra_body: {
        options: {
          num_ctx: 8192,
          temperature: 0,
          top_p: 0.9,
          // Optimization: Predict fewer tokens to end the generation faster
          num_predict: 800,
          // Keep the model 'hot' in VRAM to avoid reload latency
          keep_alive: "60m",
          // Use more threads if running on CPU (Ollama usually auto-detects, but 8 is a safe sweet spot)
          num_thread: 8,
          // If the model supports it, this helps with speed significantly
          f16_kv: true,
        },
      },
    } as any);

    const choice = response.choices[0];
    const latencyMs = Date.now() - startTime;

    const toolCalls: UnifiedToolCall[] | undefined =
      choice.message.tool_calls?.map((call) => {
        if (call.type !== "function") {
          throw new Error(`Unsupported tool call type: ${call.type}`);
        }

        return {
          id: call.id,
          name: call.function.name,
          args: JSON.parse(call.function.arguments),
        };
      });

    const finalResponse: LLMResponse = {
      content: choice.message.content || "",
      toolCalls,
      latencyMs,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };

    await this.logInteraction(params, finalResponse);

    return finalResponse;
  }

  private mapZodShapeToJsonSchema(shape: any) {
    return {
      type: "object",
      properties: Object.entries(shape).reduce(
        (acc, [key, value]: [string, any]) => {
          const typeName =
            value._def?.typeName?.replace("Zod", "").toLowerCase() || "string";
          acc[key] = {
            type: typeName === "number" ? "number" : "string",
            description: value.description || "",
          };
          return acc;
        },
        {} as any,
      ),
      required: Object.keys(shape),
    };
  }

  private mapToOpenAiMessage(msg: any) {
    if (msg.role === "tool") {
      return {
        role: "tool",
        tool_call_id: msg.toolCallId,
        content: msg.content,
      };
    }
    return {
      role: msg.role,
      content: msg.thoughtSignature
        ? `[THOUGHT]: ${msg.thoughtSignature}\n${msg.content}`
        : msg.content,
    };
  }
}
