import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { KnexModule } from '../../common/database/knex.module';
import { AiToolsModule } from '../../tools/ai-tools.module';

@Module({
  imports: [KnexModule, AiToolsModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}