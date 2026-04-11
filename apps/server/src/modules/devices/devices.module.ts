import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { KnexModule } from 'src/common/database/knex.module';

@Module({
  imports: [KnexModule],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}