import { Module } from '@nestjs/common';
import { KnexModule } from '../../common/database/knex.module';
import { FactsService } from './facts.service';

@Module({
  imports: [KnexModule],
  providers: [FactsService],
  exports: [FactsService],
})
export class FactsModule {}
