import { Module } from '@nestjs/common';
import { ConversationStatesService } from './conversation-states.service';
import { KnexModule } from 'src/common/database/knex.module';

@Module({
  imports: [KnexModule],
  providers: [ConversationStatesService],
  exports: [ConversationStatesService],   // Export so webhook module can import it
})
export class ConversationStatesModule {}