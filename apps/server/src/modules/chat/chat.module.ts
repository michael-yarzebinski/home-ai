import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { AiToolsModule } from '../../ai/ai-tools.module';

@Module({
  imports: [AiToolsModule],
  controllers: [ChatController],
})
export class ChatModule {}