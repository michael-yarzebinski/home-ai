import { Module } from "@nestjs/common";
import { CoreModule } from "../core/core.module";
import { AIModule } from "../ai/ai.module";
import { AutomationToolEventListener } from "./listeners/automation-tool-event.listener";
import { NotificationToolEventListener } from "./listeners/notification-tool-event.listener";

@Module({
  imports: [CoreModule, AIModule],
  providers: [AutomationToolEventListener, NotificationToolEventListener],
})
export class EventsModule {}
