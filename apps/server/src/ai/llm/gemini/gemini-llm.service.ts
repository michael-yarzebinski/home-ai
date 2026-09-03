import { Injectable } from "@nestjs/common";
import { GoogleGenerativeAI, Content, Part } from "@google/generative-ai";
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

@Injectable()
export class GeminiLLMService extends LLMServiceBase {
  private genAI: GoogleGenerativeAI;
  private model: string;

  get modelName(): string {
    return this.model;
  }

  constructor(
    protected readonly aiAuditStore: AIAuditStore,
    protected readonly logStore: LogStore,
    private readonly modelConfig: {
      model: string;
      apiKey: string;
    },
  ) {
    super(aiAuditStore, logStore);
    this.model = modelConfig.model;
    this.genAI = new GoogleGenerativeAI(modelConfig.apiKey);
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
    // 1. Initialize the Model with Tools
    const model = this.genAI.getGenerativeModel({
      model: this.model,
      tools: params.tools
        ? [{ functionDeclarations: this.mapToolsToGemini(params.tools) }]
        : [],
      generationConfig: {
        responseMimeType: params.jsonMode ? "application/json" : "text/plain",
      },
    });

    // 2. Convert UnifiedMessages to Gemini "Content" format
    const contents: Content[] = params.messages.map((msg) =>
      this.mapMessageToContent(msg),
    );

    // 3. Send Request
    const result = await model.generateContent({ contents });
    const response = await result.response;

    const latencyMs = Date.now() - startTime;

    // 4. Parse the Response
    const candidate = response.candidates?.[0];
    const rawText = response.text();
    const thoughtSignature = candidate?.content?.parts?.find(
      this.isThoughtSignaturePart,
    )?.thoughtSignature;
    const functionCalls = response.functionCalls();

    const toolCalls: UnifiedToolCall[] | undefined = functionCalls?.map(
      (call) => ({
        id: Math.random().toString(36).substring(7), // Gemini doesn't always provide a call ID like OpenAI
        name: call.name,
        args: call.args,
      }),
    );

    // Gemini 2.5 Flash (and other thinking models) can return an empty text part
    // on the final turn after tool use — the model put all its output into reasoning
    // (thoughtSignature) and emitted no visible content. When this happens with no
    // function calls we make one targeted follow-up asking for a plain-text reply,
    // keeping this quirk fully contained inside the provider.
    let text = rawText?.trim() ?? "";
    if (!text && (!toolCalls || toolCalls.length === 0)) {
      const summaryContents: Content[] = [
        ...contents,
        { role: "model", parts: [{ text: "" }] },
        {
          role: "user",
          parts: [
            {
              text: "Please respond with a brief plain-text summary of what you just did or your answer.",
            },
          ],
        },
      ];
      const summaryResult = await model.generateContent({
        contents: summaryContents,
      });
      text = summaryResult.response.text()?.trim() || "Done.";
    }

    const finalResponse: LLMResponse = {
      content: text,
      toolCalls,
      latencyMs,
      usage: response.usageMetadata
        ? {
            promptTokens: response.usageMetadata.promptTokenCount,
            completionTokens: response.usageMetadata.candidatesTokenCount,
            totalTokens: response.usageMetadata.totalTokenCount,
          }
        : undefined,
      metadata: {
        thoughtSignature,
      },
    };

    // 5. Log for Audit
    await this.logInteraction(params, finalResponse);

    return finalResponse;
  }

  /**
   * Maps our Zod Shapes into Gemini Function Declarations
   */
  // src/ai/llm/cloud-llm.service.ts

  private mapToolsToGemini(tools: any[]): any[] {
    return tools.map((tool) => {
      const properties: any = {};
      const required: string[] = [];

      // tool.inputSchema is the 'shape' from the Zod object
      for (const [key, value] of Object.entries(tool.inputSchema)) {
        const zodValue = value as any;

        // Safety check: ensure _def exists
        if (!zodValue._def) {
          this.logStore?.create({
            severity: "warn",
            message: `Tool ${tool.name} parameter ${key} is missing Zod definition`,
            metadata: { toolName: tool.name, parameter: key },
          });
          continue;
        }

        // Map Zod types to JSON Schema types
        let type = "string"; // fallback
        const typeName = zodValue._def.typeName;

        if (typeName === "ZodNumber") type = "number";
        if (typeName === "ZodBoolean") type = "boolean";
        if (typeName === "ZodArray") type = "array";
        if (typeName === "ZodObject") type = "object";

        properties[key] = {
          type,
          description: zodValue.description || "",
        };

        // In Zod, things are required unless specified as .optional()
        if (typeName !== "ZodOptional") {
          required.push(key);
        }
      }

      return {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object",
          properties,
          required,
        },
      };
    });
  }

  /**
   * Handles Thought Signatures for Gemini 3.1
   */
  private mapMessageToContent(msg: UnifiedMessage): Content {
    const role = msg.role === "assistant" ? "model" : "user";
    const parts: any[] = [];

    // 1. TOOL TURN (The Result)
    if (msg.role === "tool") {
      parts.push({
        functionResponse: {
          name: msg.name!,
          response:
            typeof msg.content === "string"
              ? JSON.parse(msg.content)
              : msg.content,
        },
      });
      return { role, parts };
    }

    // 2. ASSISTANT TURN (The Action)
    if (msg.role === "assistant") {
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        return {
          role,
          parts: msg.toolCalls.map((call, index) => {
            const part: any = {
              functionCall: {
                name: call.name,
                args: call.args,
              },
            };

            // Attach to the PART, not the functionCall object
            if (index === 0 && msg.metadata?.thoughtSignature) {
              part.thoughtSignature = msg.metadata.thoughtSignature;
            }

            return part;
          }),
        };
      }
    }

    // 3. TEXT TURN
    parts.push({ text: msg.content || "" });
    return { role, parts };
  }

  private isThoughtSignaturePart(
    part: any,
  ): part is Part & { thoughtSignature: string } {
    return part && !!part.thoughtSignature;
  }
}
