import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { AiToolsModule } from '../../ai/ai-tools.module';
import { KnexModule } from '../../common/database/knex.module';

@Module({
  imports: [KnexModule, AiToolsModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}