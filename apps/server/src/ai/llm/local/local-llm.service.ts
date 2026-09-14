import { Injectable } from "@nestjs/common";
import { Ollama } from "ollama";
import { v4 as uuidv4 } from "uuid";
import { LLMServiceBase } from "../../abstract/llm.service.base";
import {
  LLMQueryParams,
  UnifiedMessage,
  UnifiedToolCall,
} from "../../types/llm-query-params";
import { LLMResponse } from "../../types/llm-response";
import { AIAuditStore } from "../../../core/stores/monitoring/ai-audit/ai-audit.store";
import { LogStore } from "../../../core/stores/monitoring/log/log.store";
import { Trace } from "../../../common/decorators/trace.decorator";

const NUM_CTX = 10240;
const NUM_PREDICT = 512;
const KEEP_ALIVE = "60m";

@Injectable()
export class LocalLLMService extends LLMServiceBase {
  private client: Ollama;
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
    this.client = new Ollama({
      host: this.normalizeHost(modelConfig.baseURL),
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

  private async _query(
    params: LLMQueryParams,
    startTime: number,
  ): Promise<LLMResponse> {
    const tools =
      params.tools?.map((tool) => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: this.mapZodShapeToJsonSchema(tool.inputSchema),
        },
      })) ?? [];

    const response = await this.client.chat({
      model: this.model,
      messages: params.messages.map((msg) => this.mapToOllamaMessage(msg)),
      tools: tools.length > 0 ? tools : undefined,
      think: false,
      format: params.jsonMode ? "json" : undefined,
      stream: false,
      keep_alive: KEEP_ALIVE,
      options: {
        num_ctx: NUM_CTX,
        temperature: 0,
        top_p: 0.9,
        num_predict: NUM_PREDICT,
      },
    });

    const latencyMs = Date.now() - startTime;
    const toolCalls = this.mapToolCalls(response.message.tool_calls);
    const promptTokens = response.prompt_eval_count || 0;
    const completionTokens = response.eval_count || 0;

    const finalResponse: LLMResponse = {
      content: response.message.content || "",
      toolCalls,
      latencyMs,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };

    await this.logInteraction(params, finalResponse);

    return finalResponse;
  }

  /** OpenAI-compat URLs in .env include /v1; the native client wants the origin. */
  private normalizeHost(baseURL: string): string {
    return baseURL.replace(/\/v1\/?$/, "").replace(/\/$/, "");
  }

  private mapToOllamaMessage(msg: UnifiedMessage) {
    if (msg.role === "tool") {
      return {
        role: "tool" as const,
        content:
          typeof msg.content === "string"
            ? msg.content
            : JSON.stringify(msg.content),
        tool_name: msg.name,
      };
    }

    const thought =
      msg.metadata?.thoughtSignature || (msg as { thoughtSignature?: string }).thoughtSignature;
    const content = thought
      ? `[THOUGHT]: ${thought}\n${msg.content}`
      : msg.content;

    return {
      role: msg.role,
      content,
      tool_calls: msg.toolCalls?.map((tc) => ({
        function: {
          name: tc.name,
          arguments: tc.args,
        },
      })),
    };
  }

  private mapToolCalls(
    calls: { function?: { name?: string; arguments?: unknown } }[] | undefined,
  ): UnifiedToolCall[] | undefined {
    if (!calls?.length) {
      return undefined;
    }

    return calls.map((call) => {
      const rawArgs = call.function?.arguments;
      const args =
        typeof rawArgs === "string" ? JSON.parse(rawArgs || "{}") : rawArgs ?? {};

      return {
        id: uuidv4(),
        name: call.function?.name || "unknown",
        args,
      };
    });
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
}
