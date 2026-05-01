// src/tools/tool.module.ts
import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { ToolRegistry } from './registry/tool.registry';
import { CoreModule } from 'src/core/core.module';
import { FeaturesModule } from 'src/features/features.module';
import { AddEventToCalendarTool } from './default/calendar/add-event-to-calendar.tool';
import { DiscoverCalendarsTool } from './default/calendar/discover-calendars.tool';
import { GetCalendarEventsTool } from './default/calendar/get-calendar-events.tool';
import { ListCalendarsTool } from './default/calendar/list-calendars.tool';
import { RegisterCalendarTool } from './default/calendar/register-calendar.tool';
import { UpdateCalendarEventTool } from './default/calendar/update-calendar-event.tool';
import { DiscoverDevicesTool } from './default/device/discover-device.tool';
import { ExecuteDeviceServiceTool } from './default/device/execute-device-service.tool';
import { GetDeviceStateTool } from './default/device/get-device-state.tool';
import { ListDevicesTool } from './default/device/list-devices.tool';
import { RegisterDeviceTool } from './default/device/register-device.tool';
import { UpdateDeviceTool } from './default/device/update-device.tool';
import { AddToNoteTool } from './default/note/add-to-note.tool';
import { DiscoverNotesTool } from './default/note/discover-note.tool';
import { GetNoteTool } from './default/note/get-note.tool';
import { ListNotesTool } from './default/note/list-notes.tool';
import { RegisterNoteTool } from './default/note/register-note.tool';
import { AddAutomationRuleTool } from './default/automation-rule/add-automation-rule.tool';
import { GetAutomationRulesTool } from './default/automation-rule/get-automation-rules.tool';
import { ListAutomationRulesTool } from './default/automation-rule/list-automation-rules.tool';
import { UpdateAutomationRuleTool } from './default/automation-rule/update-automation-rule.tool';
import { GetWeatherTool } from './default/weather/get-weather.tool';
import { ApproveActionTool } from './default/pending-action/approve-action.tool';
import { ProposeActionTool } from './default/pending-action/propose-action.tool';
import { SendNotificationTool } from './default/send-notification.tool';
import { IntegrationsModule } from 'src/integrations/integrations.module';
import { ListPendingActionsTool } from './default/pending-action/list-pending-actions.tool';
import { McpService } from '../ai/mcp/mcp.service';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    CoreModule,
    AIModule,
    DiscoveryModule,
    FeaturesModule,
    IntegrationsModule,
  ],
  providers: [
    ToolRegistry,
    McpService,

    // Tools
    AddEventToCalendarTool,
    DiscoverCalendarsTool,
    GetCalendarEventsTool,
    ListCalendarsTool,
    RegisterCalendarTool,
    UpdateCalendarEventTool,
    DiscoverDevicesTool,
    ExecuteDeviceServiceTool,
    GetDeviceStateTool,
    ListDevicesTool,
    RegisterDeviceTool,
    UpdateDeviceTool,
    AddToNoteTool,
    DiscoverNotesTool,
    GetNoteTool,
    ListNotesTool,
    RegisterNoteTool,
    AddAutomationRuleTool,
    GetAutomationRulesTool,
    ListAutomationRulesTool,
    UpdateAutomationRuleTool,
    ApproveActionTool,
    ProposeActionTool,
    ListPendingActionsTool,
    GetWeatherTool,
    SendNotificationTool,
  ],
  exports: [
    ToolRegistry,
  ],
})
export class ToolsModule {}