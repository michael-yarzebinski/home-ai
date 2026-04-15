import { Module } from '@nestjs/common';
import { CoreModule } from 'src/core/core.module';
import { LLMServiceBase } from './llm-services/llm.service.base';
import { AppConfigService } from 'src/core/app-config/app-config.service';
import { CloudLLMService } from './llm-services/cloud-llm.service';
import { LocalLLMService } from './llm-services/local-llm.service';
import { AIAuditService } from 'src/core/ai-audit/ai-audit.service';

@Module({
  imports: [
    CoreModule
  ],
  providers: [
    {
      provide: LLMServiceBase,
      useFactory(aiAuditService: AIAuditService, appConfigService: AppConfigService): LLMServiceBase {
        const provider = appConfigService.getFromEnv<string>('AI_PROVIDER');

        if (provider === 'cloud') {
          return new CloudLLMService(aiAuditService, appConfigService);
        }
        else {
          return new LocalLLMService(aiAuditService, appConfigService);
        }
      },
      inject: [AIAuditService, AppConfigService]
    },
  ],
  exports: [
    LLMServiceBase,
  ],
})
export class AIModule {}
