import { Module } from '@nestjs/common';
import { AppConfigService } from './app-config/app-config.service';
import { ConfigStore } from './app-config/app-config.store';
import { ValidationService } from './validation/validation.service';
import { AuditService } from './audit/audit.service';
import { AuditTool } from '../ai/tools/utility-tools/audit.tool';

import { TasksService } from './tasks/tasks.service';
import { TaskStore } from './tasks/task.store';
import { TasksController } from './tasks/tasks.controller';

import { UsersService } from './users/users.service';
import { UserStore } from './users/user.store';
import { UsersController } from './users/users.controller';

import { FactsService } from './facts/facts.service';
import { FactStore } from './facts/fact.store';

import { DevicesService } from './devices/devices.service';
import { DeviceStore } from './devices/device.store';

import { ConversationStatesService } from './conversation-states/conversation-states.service';

import { TaskRequestsService } from './task-requests/task-requests.service';
import { TaskRequestsController } from './task-requests/task-requests.controller';
import { Knex } from 'knex';
import knexConfig from '../../knexfile';
import { KNEX_CONNECTION } from './database/knex.constants';
import { ConfigService } from '@nestjs/config';
import { BackgroundNotificationService } from './notifications/background-notification.service';
import { TaskRequestStore } from './task-requests/task-request.store';
import { UserPermissionsService } from './user-permissions/user-permissions.service';
import { ToolRegistryService } from './tools/registry/tool-registry.service';
import { LogStore } from './log/log.store';
import { LogService } from './log/log.serice';
import { AuditStore } from './audit/audit.store';
import { AIAuditService } from './ai-audit/ai-audit.service';
import { AIAuditStore } from './ai-audit/ai-audit.store';

/**
 * CoreModule (previously CommonModule + DomainModule).
 * 
 * This is the central core/domain layer containing:
 * - AppConfigService (unified strict configuration)
 * - AbstractEntityStore + all concrete stores
 * - ValidationService
 * - All domain entity services (TasksService, UsersService, FactsService, etc.)
 * - Relevant controllers
 * 
 * The previous DomainModule has been merged into this single CoreModule.
 * The domain/ folder and domain.module.ts have been removed.
 * All files from the previous common/ folder have been moved under the core/ structure.
 */
@Module({
  imports: [],
  controllers: [
    TasksController,
    UsersController,
    TaskRequestsController,
  ],
  providers: [
    {
      provide: KNEX_CONNECTION,
      useFactory: (configService: ConfigService): Knex => {
        const env = configService.get<string>('NODE_ENV') || 'development';
        
        const config = (knexConfig as any)[env] || knexConfig.development;

        if (!config || !config.client) {
          throw new Error(`Knex configuration for environment "${env}" is missing. Check knexfile.ts`);
        }

        const knexInstance = require('knex')(config);

        console.log(`✅ Knex connected to database: ${config.connection.database}`);
        return knexInstance;
      },
      inject: [ConfigService],        // Use NestJS built-in ConfigService
    },

    // Config/Audit services provided directly (ConfigModule and AuditModule removed)
    ConfigStore,
    AppConfigService,
    BackgroundNotificationService,
    ValidationService,
    AuditService,
    AuditStore,
    AuditTool,
    TasksService,
    TaskStore,
    UsersService,
    UserStore,
    FactsService,
    FactStore,
    DevicesService,
    DeviceStore,
    ConversationStatesService,
    TaskRequestsService,
    TaskRequestStore,
    UserPermissionsService,
    ToolRegistryService,
    LogStore,
    LogService,
    AIAuditStore,
    AIAuditService,
  ],
  exports: [
    // Export everything needed by higher-level modules
    KNEX_CONNECTION,
    AppConfigService,
    BackgroundNotificationService,
    ConfigStore,
    ValidationService,
    AuditService,
    TasksService,
    TaskStore,
    UsersService,
    UserStore,
    FactsService,
    FactStore,
    DevicesService,
    DeviceStore,
    ConversationStatesService,
    TaskRequestsService,
    UserPermissionsService,
    ToolRegistryService,
    LogService,
    AIAuditService,
  ],
})
export class CoreModule {}
