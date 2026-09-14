import { forwardRef, Module } from "@nestjs/common";
import { CoreModule } from "../core/core.module";
import { AppConfigService } from "../core/services/app-config.service";
import { GeminiLLMService } from "./llm/gemini/gemini-llm.service";
import { AIAuditStore } from "../core/stores/monitoring/ai-audit/ai-audit.store";
import { LogStore } from "../core/stores/monitoring/log/log.store";
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
          const prefix = type.toUpperCase();
          const clientType = appConfigService.getFromEnv<ProviderClientType>(
            `${prefix}_CLIENT_TYPE`,
          );
          const model = appConfigService.getFromEnv<string>(
            `${prefix}_MODEL_NAME`,
          );

          if (clientType === ProviderClientType.OPENAI) {
            registry.set(
              type,
              new OpenAILLMService(aiAuditStore, logStore, {
                apiKey: appConfigService.getFromEnv<string>(`${prefix}_API_KEY`),
                baseURL: appConfigService.getFromEnv<string>(
                  `${prefix}_BASE_URL`,
                ),
                model,
              }),
            );
          } else if (clientType === ProviderClientType.GEMINI) {
            registry.set(
              type,
              new GeminiLLMService(aiAuditStore, logStore, {
                apiKey: appConfigService.getFromEnv<string>(`${prefix}_API_KEY`),
                model,
              }),
            );
          } else if (clientType === ProviderClientType.OLLAMA) {
            registry.set(
              type,
              new LocalLLMService(aiAuditStore, logStore, {
                model,
                baseURL: appConfigService.getFromEnv<string>(
                  `${prefix}_BASE_URL`,
                ),
              }),
            );
          } else {
            throw new Error(
              `Unsupported provider type: ${clientType} for flow ${type}`,
            );
          }
        }

        return registry;
      },
      inject: [AppConfigService, AIAuditStore, LogStore],
    },
    LLMProviderService,
    OrchestratorService,

    ChromaService,
    MemoryService,
  ],
  exports: [OrchestratorService, LLMProviderService],
  controllers: [ChatController, MemoryAdminController],
})
export class AIModule { }
