// apps/server/src/ai/orchestrator/orchestrator.module.ts
import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { ToolsModule } from '../tools/tools.module';

import { AIOrchestratorService } from './ai-orchestrator.service';
import { TaskRouter } from './router/task.router';
import { AIModule } from 'src/ai/ai.module';
import { ChatController } from './chat/chat.controller';
import { TaskIdentificationService } from './task-identification.service';

@Module({
  imports: [
    CoreModule,
    ToolsModule,
    AIModule,
  ],
  providers: [
    AIOrchestratorService,
    TaskIdentificationService,
    TaskRouter,
  ],
  controllers: [ChatController],
  exports: [
    AIOrchestratorService,
  ],
})
export class OrchestratorModule {}