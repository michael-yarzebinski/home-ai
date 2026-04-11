import { Module } from '@nestjs/common';
import { ConversationStatesService } from './conversation-states.service';

@Module({
  providers: [ConversationStatesService],
  exports: [ConversationStatesService],   // Export so webhook module can import it
})
export class ConversationStatesModule {}