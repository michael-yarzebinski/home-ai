import { Module } from '@nestjs/common';
import { CoreModule } from '../../core.module';
import { DevicesAdminController } from './devices.admin.controller';
import { UsersAdminController } from './users.admin.controller';
import { AppConfigAdminController } from './app-config.admin.controller';
import { ToolsAdminController } from './tools.admin.controller';
import { CalendarsAdminController } from './calendars.admin.controller';
import { NotesAdminController } from './notes.admin.controller';
import { NotificationQueueAdminController } from './notification-queue.admin.controller';
import { PendingActionsAdminController } from './pending-actions.admin.controller';
import { AutomationRulesAdminController } from './automation-rules.admin.controller';
import { AIAuditAdminController } from './ai-audit.admin.controller';
import { AuditAdminController } from './audit.admin.controller';
import { LogsAdminController } from './logs.admin.controller';
import { NotificationLogAdminController } from './notification-log.admin.controller';
import { DashboardAdminController } from './dashboard.admin.controller';

@Module({
  imports: [CoreModule],
  controllers: [
    DevicesAdminController,
    UsersAdminController,
    AppConfigAdminController,
    ToolsAdminController,
    CalendarsAdminController,
    NotesAdminController,
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
