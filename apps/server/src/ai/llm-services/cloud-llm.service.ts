import { Logger } from "@nestjs/common";
import { LLMServiceBase } from "./llm.service.base";
import { AppConfigService } from "src/core/entities/app-config/app-config.service";
import OpenAI from "openai";
import { ChatMessage } from "src/core/entities/conversation-state/conversation-state.service";
import { AIAuditService } from "src/core/entities/monitoring/ai-audit/ai-audit.service";
import { LLMQueryParams } from "../llm.dtos";

export class CloudLLMService extends LLMServiceBase {
    protected readonly logger = new Logger(this.constructor.name);
    private readonly client: OpenAI;
    private readonly model: string;


    constructor(
        protected readonly auditService: AIAuditService,
        protected readonly configService: AppConfigService,
    ) {
        super(auditService);

        const apiKey = this.configService.getFromEnv<string>('XAI_API_KEY');
        this.model = this.configService.getFromEnv<string>('OLLAMA_MODEL');

        this.client = new OpenAI({
            apiKey,
            baseURL: 'https://api.x.ai/v1', // TODO: make this a env value.
          });
    }

    async queryLLM<T>(llmQueryParams: LLMQueryParams): Promise<T> {
        const startTime = Date.now();

        const {prompt, userId, eventType, chatHistory } = llmQueryParams;
        
        const messages: ChatMessage[] = [
            { role: 'system', content: prompt },
            ...(chatHistory ? chatHistory : []),
          ];
        
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages,
            response_format: { type: 'json_object' }, // Grok supports JSON mode; full JSON schema supported on recent models
            temperature: 0.0,
            max_tokens: 1024,
        });
        const content = response.choices[0]?.message?.content?.trim() ?? '';
        const parsedContent = this.parseResponse<T>(content);

        const latency = Date.now() - startTime;

        await this.insertAIAudit(prompt, eventType, content, parsedContent, userId, latency, chatHistory);

        return parsedContent;
    }
}
