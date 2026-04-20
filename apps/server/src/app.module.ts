import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/core.module';
import { IntegrationModule } from './integration/integration.module';
import { HealthModule } from './health/health.module';
import { ToolsModule } from './tools/tools.module';
import { AIModule } from './ai/ai.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { RemoteModule } from './remote/remote.module';
import { FeaturesModule } from './features/features.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // Global Configuration (official NestJS)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),

    HealthModule,

    // Core Infrastructure
    CoreModule,

    AIModule,
    OrchestratorModule,
    IntegrationModule,
    ToolsModule,

    FeaturesModule,

    RemoteModule,

    AuthModule,
  ],
})
export class AppModule {}
