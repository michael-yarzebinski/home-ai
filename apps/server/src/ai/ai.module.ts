import { forwardRef, Module } from "@nestjs/common";
import { CoreModule } from "../core/core.module";
import { AppConfigService } from "../core/services/app-config.service";
import { GeminiLLMService } from "./llm/gemini/gemini-llm.service";
import { AIAuditStore } from "../core/stores/monitoring/ai-audit/ai-audit.store";
import { LogStore } from "../core/stores/monitoring/log/log.store";
import { McpService } from "./mcp/mcp.service";
import { OrchestratorService } from "./orchestrator/orchestrator.service";
import { ClsModule } from "nestjs-cls";
import { ToolsModule } from "../tools/tool.module";
import { ChatController } from "./controllers/chat.controller";
import { MemoryAdminController } from "./controllers/admin/memory.admin.controller";
import { OpenAILLMService } from "./llm/open-ai/open-ai-llm.service";
import {
  LLM_REGISTRY,
  LLMModelTypes,
  LLMProviderService,
  ProviderClientType,
} from "./llm/llm.provider.sevice";
import { LLMServiceBase } from "./abstract/llm.service.base";
import { LocalLLMService } from "./llm/local/local-llm.service";
import { ChromaService } from "./memory/chroma.service";
import { MemoryService } from "./memory/memory.service";

@Module({
  imports: [CoreModule, ClsModule.forFeature(), forwardRef(() => ToolsModule)],
  providers: [
    {
      provide: LLM_REGISTRY,
      useFactory(
        appConfigService: AppConfigService,
        aiAuditStore: AIAuditStore,
        logStore: LogStore,
      ): Map<LLMModelTypes, LLMServiceBase> {
        const registry = new Map<LLMModelTypes, LLMServiceBase>();

        for (const type of Object.values(LLMModelTypes)) {
          // 1. Grab the dynamic config from the environment
          const config = {
            clientType: appConfigService.getFromEnv<ProviderClientType>(
              `${type.toUpperCase()}_CLIENT_TYPE`,
            ),
            apiKey: appConfigService.getFromEnv<string>(
              `${type.toUpperCase()}_API_KEY`,
            ),
            model: appConfigService.getFromEnv<string>(
              `${type.toUpperCase()}_MODEL_NAME`,
            ),
            baseUrl: appConfigService.getFromEnv<string>(
              `${type.toUpperCase()}_BASE_URL`,
            ),
          };

          // 2. Map the ClientType to the correct Service implementation
          if (config.clientType === ProviderClientType.OPENAI) {
            registry.set(
              type,
              new OpenAILLMService(aiAuditStore, logStore, {
                apiKey: config.apiKey,
                baseURL: config.baseUrl,
                model: config.model,
              }),
            );
          } else if (config.clientType === ProviderClientType.GEMINI) {
            registry.set(
              type,
              new GeminiLLMService(aiAuditStore, logStore, {
                apiKey: config.apiKey,
                model: config.model,
              }),
            );
          } else if (config.clientType === ProviderClientType.OLLAMA) {
            registry.set(
              type,
              new LocalLLMService(aiAuditStore, logStore, {
                model: config.model,
                baseURL: config.baseUrl,
              }),
            );
          } else {
            throw new Error(
              `Unsupported provider type: ${config.clientType} for flow ${type}`,
            );
          }
        }

        return registry;
      },
      inject: [AppConfigService, AIAuditStore, LogStore],
    },
    LLMProviderService,
    OrchestratorService,
    McpService,

    ChromaService,
    MemoryService,
  ],
  exports: [OrchestratorService, McpService, LLMProviderService],
  controllers: [ChatController, MemoryAdminController],
})
export class AIModule { }
