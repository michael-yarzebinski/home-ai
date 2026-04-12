import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/core.module';
import { AIToolsModule } from './ai/ai-tools.module';
import { IntegrationModule } from './integration/integration.module';
import { HealthModule } from './health/health.module';

/**
 * Root application module with the new consolidated structure.
 * 
 * New structure under apps/server/src/:
 * core/ (previously common/ + merged domain logic)
 *   - core.module.ts (merged CoreModule + DomainModule)
 *   - app-config.service.ts
 *   - validation.service.ts
 *   - abstract-entity.store.ts
 *   - config.store.ts, config.domain.ts
 *   - database/ (knex.module.ts, etc.)
 *   - other shared files
 * 
 * modules/ (unchanged)
 * tools/
 * integration/
 * app.module.ts
 * main.ts
 * 
 * Flow: IntegrationModule → ToolsModule → CoreModule → NotificationModule → iMessage
 */
@Module({
  imports: [
    // Global Configuration (official NestJS)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    HealthModule,

    // Core Infrastructure
    CoreModule,

    // Business Logic Layers
    AIToolsModule,          // AI brain (AIToolsService, tools, execution router)
    IntegrationModule,    // All incoming integrations (webhook, iMessage input)
  ],
})
export class AppModule {}
