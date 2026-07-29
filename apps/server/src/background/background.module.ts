import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { CoreModule } from "../core/core.module";
import { IntegrationsModule } from "../integrations/integrations.module";
import { NotificationQueueProcessor } from "./notification-queue/notification-queue.processor";

@Module({
  imports: [CoreModule, IntegrationsModule, ScheduleModule.forRoot()],
  providers: [NotificationQueueProcessor],
})
export class BackgroundModule {}
