import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KnexModule } from '../common/database/knex.module';
import { AiToolsService } from './ai-tools.service';
import { DetectTaskTool } from './detect-task.tool';
import { PermissionTool } from './permission.tool';
import { ExecutionRouter } from './execution.router';
import { AppleNotesTool } from './apple-notes.tool';
import { CalendarTool } from './calendar.tool';
import { FactsTool } from './facts.tool';
import { SummaryTool } from './summary.tool';
import { NotificationTool } from './notification.tool';
import { AuditTool } from './audit.tool';

@Module({
  imports: [KnexModule],
  providers: [
    AiToolsService,
    DetectTaskTool,
    PermissionTool,
    ExecutionRouter,
    AppleNotesTool,
    CalendarTool,
    FactsTool,
    SummaryTool,
    NotificationTool,
    AuditTool,
  ],
  exports: [
    AiToolsService,
    DetectTaskTool,
    PermissionTool,
    ExecutionRouter,
    AppleNotesTool,
    CalendarTool,
    FactsTool,
    SummaryTool,
    NotificationTool,
    AuditTool,
  ],
})
export class AiToolsModule {}