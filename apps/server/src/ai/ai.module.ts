import { forwardRef, Module } from "@nestjs/common";
import { CoreModule } from "../core/core.module";
import { LLMServiceBase } from "./abstract/llm.service.base";
import { AppConfigService } from "../core/services/app-config.service";
import { CloudLLMService } from "./llm/cloud-llm.service";
import { LocalLLMService } from "./llm/local-llm.service";
import { AIAuditStore } from "../core/stores/ai-audit/ai-audit.store";
import { McpService } from "./mcp/mcp.service";
import { OrchestratorService } from "./orchestrator/orchestrator.service";
import { ClsModule } from "nestjs-cls";
import { ToolsModule } from "../tools/tool.module";
import { ChatController } from "./controllers/chat.controller";

@Module({
  imports: [CoreModule, ClsModule.forFeature(), forwardRef(() => ToolsModule)],
  providers: [
    {
      provide: LLMServiceBase,
      useFactory(
        aiAuditStore: AIAuditStore,
        appConfigService: AppConfigService,
      ): LLMServiceBase {
        const provider = appConfigService.getFromEnv<string>("AI_PROVIDER");

        if (provider === "cloud") {
          return new CloudLLMService(appConfigService, aiAuditStore);
        } else {
          return new LocalLLMService(appConfigService, aiAuditStore);
        }
      },
      inject: [AIAuditStore, AppConfigService],
    },
    OrchestratorService,
    McpService,
  ],
  exports: [
    OrchestratorService,
    LLMServiceBase, // Export the abstract token
    McpService,
  ],
  controllers: [ChatController],
})
export class AIModule {}
