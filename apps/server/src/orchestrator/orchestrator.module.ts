// apps/server/src/ai/orchestrator/orchestrator.module.ts
import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { ToolsModule } from '../tools/tools.module';

import { AIOrchestratorService } from './ai-orchestrator.service';
import { ToolRouter } from './router/tool.router';
import { AIModule } from 'src/ai/ai.module';
import { ChatController } from './chat/chat.controller';

@Module({
  imports: [
    CoreModule,
    ToolsModule,
    AIModule,
  ],
  providers: [
    AIOrchestratorService,
    ToolRouter,
  ],
  controllers: [ChatController],
  exports: [
    AIOrchestratorService,
  ],
})
export class OrchestratorModule {}