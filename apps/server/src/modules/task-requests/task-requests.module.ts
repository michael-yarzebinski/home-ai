import { Module } from '@nestjs/common';
import { TaskRequestsService } from './task-requests.service';
import { TaskRequestsController } from './task-requests.controller';
import { KnexModule } from '../../common/database/knex.module';

@Module({
  imports: [KnexModule],
  controllers: [TaskRequestsController],
  providers: [TaskRequestsService],
  exports: [TaskRequestsService],
})
export class TaskRequestsModule {}