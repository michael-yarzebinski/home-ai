import { Logger } from "@nestjs/common";
import { LLMQueryParams, LLMServiceBase } from "./llm.service.base";
import { Ollama } from "ollama";
import { AppConfigService } from "src/core/app-config/app-config.service";
import { ChatMessage } from "src/core/conversation-states/conversation-states.service";
import { AIAuditService } from "src/core/ai-audit/ai-audit.service";

export class LocalLLMService extends LLMServiceBase {
    protected readonly logger = new Logger(this.constructor.name);
    private readonly ollama: Ollama;
    private readonly model: string;


    constructor(
        protected readonly aiAuditService: AIAuditService,
        protected readonly configService: AppConfigService,
    ) {
        super(aiAuditService);

        const host = this.configService.getFromEnv<string>('LOCAL_AI_HOST');
        this.model = this.configService.getFromEnv<string>('LOCAL_AI_MODEL');

        this.ollama = new Ollama({
            host,
        });
    }

    async queryLLM<T>(llmQueryParams: LLMQueryParams): Promise<T> {
        const startTime = Date.now();

        const {prompt, userId, eventType, chatHistory } = llmQueryParams;

        const messages: ChatMessage[] = [
            { role: 'system', content: prompt },
            ...(chatHistory ? chatHistory : []),
          ];
        

        const response = await this.ollama.chat({
            model: this.model,
            messages,
        });
        const content = response.message?.content.trim();
        const parsedContent = this.parseResponse<T>(content);

        const latency = Date.now() - startTime;

        await this.insertAIAudit(prompt, eventType, content, parsedContent, userId, latency, chatHistory);

        return parsedContent;
    }
}
