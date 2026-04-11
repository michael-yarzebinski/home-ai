import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KnexModule } from './common/database/knex.module';
import { AiToolsModule } from './tools/ai-tools.module';

import { UsersModule } from './modules/users/users.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TaskRequestsModule } from './modules/task-requests/task-requests.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { HealthModule } from './modules/health/health.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    // Global Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HealthModule,

    // Database
    KnexModule,

    // AI Core Tools (the brain)
    AiToolsModule,

    // Feature Modules
    UsersModule,
    TasksModule,
    TaskRequestsModule,
    NotificationsModule,
    AuditModule,
    WebhookModule,

    ChatModule,
  ],
})
export class AppModule {}