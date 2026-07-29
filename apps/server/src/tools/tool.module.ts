// src/tools/tool.module.ts
import { Module } from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";
import { ToolRegistry } from "./registry/tool.registry";
import { CoreModule } from "src/core/core.module";
import { FeaturesModule } from "src/features/features.module";
import { DiscoverDevicesTool } from "./default/device/discover-device.tool";
import { ExecuteDeviceServiceTool } from "./default/device/execute-device-service.tool";
import { GetDeviceStateTool } from "./default/device/get-device-state.tool";
import { ListDevicesTool } from "./default/device/list-devices.tool";
import { RegisterDeviceTool } from "./default/device/register-device.tool";
import { UpdateDeviceTool } from "./default/device/update-device.tool";
import { AddAutomationRuleTool } from "./default/automation-rule/add-automation-rule.tool";
import { GetAutomationRulesTool } from "./default/automation-rule/get-automation-rules.tool";
import { ListAutomationRulesTool } from "./default/automation-rule/list-automation-rules.tool";
import { UpdateAutomationRuleTool } from "./default/automation-rule/update-automation-rule.tool";
import { ApproveActionTool } from "./default/pending-action/approve-action.tool";
import { ProposeActionTool } from "./default/pending-action/propose-action.tool";
import { SendNotificationTool } from "./default/notification/send-notification.tool";
import { IntegrationsModule } from "src/integrations/integrations.module";
import { ListPendingActionsTool } from "./default/pending-action/list-pending-actions.tool";
import { AIModule } from "../ai/ai.module";

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

    // Tools
    DiscoverDevicesTool,
    ExecuteDeviceServiceTool,
    GetDeviceStateTool,
    ListDevicesTool,
    RegisterDeviceTool,
    UpdateDeviceTool,
    AddAutomationRuleTool,
    GetAutomationRulesTool,
    ListAutomationRulesTool,
    UpdateAutomationRuleTool,
    ApproveActionTool,
    ProposeActionTool,
    ListPendingActionsTool,
    SendNotificationTool,
    // RejectActionTool,
  ],
  exports: [ToolRegistry],
})
export class ToolsModule {}
