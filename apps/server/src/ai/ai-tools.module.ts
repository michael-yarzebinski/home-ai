import { Module } from '@nestjs/common';

import { PermissionTool } from './tools/utility-tools/permission.tool';
import { ToolRouter } from './router/tool.router';
import { AppleNotesTool } from './tools/task-tools/apple-notes.tool';
import { CalendarTool } from './tools/task-tools/calendar.tool';
import { FactsTool } from './tools/task-tools/facts.tool';
import { SummaryTool } from './tools/task-tools/summary.tool';
import { NotificationTool } from './tools/utility-tools/notification.tool';
import { AuditTool } from './tools/utility-tools/audit.tool';
import { DeviceTool } from './tools/task-tools/device.tool';
import { AIToolsServiceBase } from './ai-tools-service/ai-tools.service.base';
import { ConfigService } from '@nestjs/config';
import { ConversationStatesService } from 'src/core/conversation-states/conversation-states.service';
import { UsersService } from 'src/core/users/users.service';
import { TasksService } from 'src/core/tasks/tasks.service';
import { CloudAIToolsService } from './ai-tools-service/cloud-ai-tools.service';
import { LocalAIToolsService } from './ai-tools-service/local-ai-tools.service';
import { CoreModule } from 'src/core/core.module';
import { ChatController } from './chat/chat.controller';

@Module({
  imports: [
    CoreModule
  ],
  controllers: [
    ChatController,
  ],
  providers: [
    {
      provide: AIToolsServiceBase,
      useFactory: (
        configService: ConfigService,
        permissionTool: PermissionTool,
        toolRouter: ToolRouter,
        auditTool: AuditTool,
        notificationTool: NotificationTool,
        tasksService: TasksService,
        usersService: UsersService,
        conversationStatesService: ConversationStatesService,
      ): AIToolsServiceBase => {
        const provider = configService.get<string>('AI_PROVIDER', 'local')
          .toLowerCase()
          .trim();

        if (provider === 'cloud') {
          return new CloudAIToolsService(
            permissionTool,
            toolRouter,
            auditTool,
            notificationTool,
            tasksService,
            usersService,
            conversationStatesService,
          );
        }

        // Default to local
        return new LocalAIToolsService(
          permissionTool,
          toolRouter,
          auditTool,
          notificationTool,
          tasksService,
          usersService,
          conversationStatesService,
        );
      },
      inject: [
        ConfigService,
        PermissionTool,
        ToolRouter,
        AuditTool,
        NotificationTool,
        TasksService,
        UsersService,
        ConversationStatesService,
      ],
    },

    PermissionTool,
    ToolRouter,
    AppleNotesTool,
    CalendarTool,
    FactsTool,
    SummaryTool,
    NotificationTool,
    AuditTool,
    DeviceTool,
    ConfigService,
  ],
  exports: [
    AIToolsServiceBase,
    PermissionTool,
    ToolRouter,
    AppleNotesTool,
    CalendarTool,
    FactsTool,
    SummaryTool,
    NotificationTool,
    AuditTool,
    DeviceTool,
    ConfigService,
  ],
})
export class AIToolsModule {}
