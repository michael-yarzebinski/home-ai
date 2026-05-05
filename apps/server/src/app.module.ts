// src/app.module.ts
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ToolsModule } from "./tools/tool.module";
import { CoreModule } from "./core/core.module";
import { AdminModule } from "./core/controllers/admin/admin.module";
import { AIModule } from "./ai/ai.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { FeaturesModule } from "./features/features.module";
import { BackgroundModule } from "./background/background.module";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./health/health.module";
import { ClsModule } from "nestjs-cls";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { HttpModule } from "@nestjs/axios";
import { AppConfigService } from "./core/services/app-config.service";
import { RedisModule } from "@nestjs-modules/ioredis";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere
      envFilePath: "../../.env", // optional - adjust if you use a different path
    }),

    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        // Optional: you can pre-populate the currentISO here
        // but it's cleaner to do it in the Orchestrator for AI tasks
      },
    }),
    RedisModule.forRootAsync({
      imports: [CoreModule],
      useFactory: (configService: AppConfigService) => {
        const redisHost = configService.getFromEnv('REDIS_HOST');
        const redisPort = configService.getFromEnv('REDIS_PORT');

        return {
          type: 'single',
          url: `redis://${redisHost}:${redisPort}`,
          options: {
            retryStrategy: (times) => Math.min(times * 50, 2000),
          },
        };
      },
      inject: [AppConfigService],
    }),
    HttpModule,

    CoreModule,
    AdminModule,
    AIModule,
    BackgroundModule,
    FeaturesModule,
    IntegrationsModule,
    ToolsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule { }
