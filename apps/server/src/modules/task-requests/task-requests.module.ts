import { Module } from '@nestjs/common';
import { TaskRequestsService } from './task-requests.service';
import { TaskRequestsController } from './task-requests.controller';
import { KnexModule } from '../../common/database/knex.module';
import { AiToolsModule } from '../../tools/ai-tools.module';

@Module({
  imports: [KnexModule, AiToolsModule],
  controllers: [TaskRequestsController],
  providers: [TaskRequestsService],
  exports: [TaskRequestsService],
})
export class TaskRequestsModule {}