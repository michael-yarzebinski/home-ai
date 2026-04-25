import { Injectable } from "@nestjs/common";
import { GoogleGenerativeAI, Content, Part } from "@google/generative-ai";
import { LLMServiceBase } from "../abstract/llm.service.base";
import { LLMQueryParams, UnifiedToolCall } from "../types/llm-query-params";
import { LLMResponse } from "../types/llm-response";
import { AIAuditStore } from "../../core/stores/ai-audit/ai-audit.store";
import { AppConfigService } from "../../core/services/app-config.service";

@Injectable()
export class CloudLLMService extends LLMServiceBase {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(
    protected readonly appConfigService: AppConfigService,
    protected readonly aiAuditStore: AIAuditStore,
  ) {
    super(aiAuditStore);
    const apiKey = this.appConfigService.getFromEnv("CLOUD_LLM_API_KEY");
    this.model = this.appConfigService.getFromEnv("CLOUD_LLM_MODEL");

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async query(params: LLMQueryParams): Promise<LLMResponse> {
    const startTime = Date.now();

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
    const contents: Content[] = params.messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: this.mapMessageToParts(msg),
    }));

    // 3. Send Request
    const result = await model.generateContent({ contents });
    const response = await result.response;
    const latencyMs = Date.now() - startTime;

    // 4. Parse the Response
    const text = response.text();
    const functionCalls = response.functionCalls();

    const toolCalls: UnifiedToolCall[] | undefined = functionCalls?.map(
      (call) => ({
        id: Math.random().toString(36).substring(7), // Gemini doesn't always provide a call ID like OpenAI
        name: call.name,
        args: call.args,
      }),
    );

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
        console.warn(`Tool ${tool.name} parameter ${key} is missing Zod definition.`);
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
  private mapMessageToParts(msg: any): Part[] {
    const parts: Part[] = [{ text: msg.content }];

    if (msg.thoughtSignature) {
      // 2026 Standard: Injects the reasoning chain so the model stays on track
      parts.unshift({ text: `[THOUGHT]: ${msg.thoughtSignature}` });
    }

    if (msg.role === "tool") {
      // Special handling for tool response parts
      return [
        {
          functionResponse: {
            name: msg.name,
            response: JSON.parse(msg.content),
          },
        },
      ];
    }

    return parts;
  }
}
