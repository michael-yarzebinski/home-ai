import { Module } from "@nestjs/common";
import { CoreModule } from "../core.module";
import { DevicesAdminController } from "./devices/admin/devices.admin.controller";
import { UsersAdminController } from "./users/admin/users.admin.controller";
import { AppConfigAdminController } from "./app-config/admin/app-config.admin.controller";
import { ToolsAdminController } from "./tools/admin/tools.admin.controller";
import { NotificationQueueAdminController } from "./notification-queue/admin/notification-queue.admin.controller";
import { PendingActionsAdminController } from "./pending-actions/admin/pending-actions.admin.controller";
import { AutomationRulesAdminController } from "./automation-rules/admin/automation-rules.admin.controller";
import { AIAuditAdminController } from "./monitoring/ai-audit/admin/ai-audit.admin.controller";
import { AuditAdminController } from "./monitoring/audit/admin/audit.admin.controller";
import { LogsAdminController } from "./monitoring/logs/admin/logs.admin.controller";
import { NotificationLogAdminController } from "./monitoring/notification-log/admin/notification-log.admin.controller";
import { DashboardAdminController } from "./dashboard/admin/dashboard.admin.controller";

@Module({
  imports: [CoreModule],
  controllers: [
    DevicesAdminController,
    UsersAdminController,
    AppConfigAdminController,
    ToolsAdminController,
    NotificationQueueAdminController,
    PendingActionsAdminController,
    AutomationRulesAdminController,
    AIAuditAdminController,
    AuditAdminController,
    LogsAdminController,
    NotificationLogAdminController,
    DashboardAdminController,
  ],
})
export class AdminModule {}
