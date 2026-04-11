import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { KnexModule } from '../../common/database/knex.module';

@Module({
  imports: [KnexModule],
  controllers: [HealthController],
})
export class HealthModule {}