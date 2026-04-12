import { Module } from '@nestjs/common';

import { HealthController } from './health.controller';
import { CoreModule } from 'src/core/core.module';

/**
 * HealthModule - Provides health check endpoint for monitoring.
 * 
 * This module is kept separate for operational concerns but uses the CoreModule
 * infrastructure (through KnexModule and ConfigModule).
 */
@Module({
  imports: [CoreModule],
  controllers: [HealthController],
})
export class HealthModule {}
