// apps/server/src/ai/orchestrator/orchestrator.module.ts
import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { ToolsModule } from '../tools/tools.module';

import { AIOrchestratorService } from './ai-orchestrator.service';
import { TaskRouter } from './router/task.router';
import { AIModule } from 'src/ai/ai.module';
import { ChatController } from './chat/chat.controller';
import { TaskIdentificationService } from './task-identification.service';
import { AuthModule } from '../auth/auth.module';
import { HomeAssistantSubscriberService } from './home-assistant-subscriber.service';

@Module({
  imports: [
    CoreModule,
    ToolsModule,
    AIModule,
    AuthModule,
  ],
  providers: [
    AIOrchestratorService,
    TaskIdentificationService,
    TaskRouter,
    HomeAssistantSubscriberService
  ],
  controllers: [ChatController],
  exports: [
    AIOrchestratorService,
  ],
})
export class OrchestratorModule {}