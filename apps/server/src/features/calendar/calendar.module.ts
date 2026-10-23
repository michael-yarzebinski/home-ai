import { Module } from "@nestjs/common";
import { CoreModule } from "src/core/core.module";
import { CalendarStore } from "./stores/calendar.store";
import { CalendarsController } from "./controllers/calendars.controller";
import { CalendarsAdminController } from "./controllers/admin/calendars.admin.controller";
import { AddEventToCalendarTool } from "./tools/add-event-to-calendar.tool";
import { DiscoverCalendarsTool } from "./tools/discover-calendars.tool";
import { GetCalendarEventsTool } from "./tools/get-calendar-events.tool";
import { FindCalendarsTool } from "./tools/find-calendars.tool";
import { ListCalendarsTool } from "./tools/list-calendars.tool";
import { RegisterCalendarTool } from "./tools/register-calendar.tool";
import { UpdateCalendarEventTool } from "./tools/update-calendar-event.tool";
import { IntegrationsModule } from "../../integrations/integrations.module";

@Module({
  imports: [CoreModule, IntegrationsModule],
  controllers: [CalendarsAdminController, CalendarsController],
  providers: [
    CalendarStore,
    AddEventToCalendarTool,
    DiscoverCalendarsTool,
    GetCalendarEventsTool,
    FindCalendarsTool,
    ListCalendarsTool,
    RegisterCalendarTool,
    UpdateCalendarEventTool,
  ],
  exports: [
    CalendarStore,
    AddEventToCalendarTool,
    DiscoverCalendarsTool,
    GetCalendarEventsTool,
    FindCalendarsTool,
    ListCalendarsTool,
    RegisterCalendarTool,
    UpdateCalendarEventTool,
  ],
})
export class CalendarModule {}
