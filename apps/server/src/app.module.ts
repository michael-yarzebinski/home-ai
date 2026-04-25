// src/app.module.ts
import { Module } from "@nestjs/common";
import { ToolsModule } from "./tools/tool.module";
import { CoreModule } from "./core/core.module";
import { AIModule } from "./ai/ai.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { FeaturesModule } from "./features/features.module";
import { BackgroundModule } from "./background/background.module";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./health/health.module";
import { ClsModule } from "nestjs-cls";

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

    CoreModule,
    AIModule,
    BackgroundModule,
    FeaturesModule,
    IntegrationsModule,
    ToolsModule,
    HealthModule,
  ],
})
export class AppModule {}
