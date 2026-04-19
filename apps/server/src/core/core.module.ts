import { Module } from '@nestjs/common';
import { AppConfigService } from './entities/app-config/app-config.service';
import { ValidationService } from './validation/validation.service';
import { AuditService } from './entities/monitoring/audit/audit.service';

import { TasksService } from './entities/task/tasks.service';
import { TaskStore } from './entities/task/task.store';
import { TasksController } from './entities/task/tasks.controller';

import { UsersService } from './entities/user/user.service';
import { UserStore } from './entities/user/user.store';
import { UsersController } from './entities/user/user.controller';

import { FactService } from './fact/fact.service';
import { FactStore } from './fact/fact.store';

import { DeviceService } from './entities/device/device.service';
import { DeviceStore } from './entities/device/device.store';

import { ConversationStateService } from './entities/conversation-state/conversation-state.service';

import { TaskRequestsService } from './entities/task-request/task-requests.service';
import { TaskRequestsController } from './entities/task-request/task-requests.controller';
import { Knex } from 'knex';
import knexConfig from '../../knexfile';
import { KNEX_CONNECTION } from './database/knex.constants';
import { ConfigService } from '@nestjs/config';
import { BackgroundNotificationService } from '../integration/background-notification.service';
import { TaskRequestStore } from './entities/task-request/task-request.store';
import { UserPermissionsService } from './user-permissions/user-permissions.service';
import { TaskRegistryService } from './task-registry/registry/task-registry.service';
import { LogStore } from './entities/monitoring/log/log.store';
import { LogService } from './entities/monitoring/log/log.serice';
import { AuditStore } from './entities/monitoring/audit/audit.store';
import { AIAuditService } from './entities/monitoring/ai-audit/ai-audit.service';
import { AIAuditStore } from './entities/monitoring/ai-audit/ai-audit.store';
import { AppConfigStore } from './entities/app-config/app-config.store';
import { ConversationStateStore } from './entities/conversation-state/conversation-state.store';
import { TransactionManager } from './database/transaction-manager';
import { NotificationService } from './entities/notification/notification.service';
import { NotificationStore } from './entities/notification/notification.store';

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
    TransactionManager,

    // Config/Audit services provided directly (ConfigModule and AuditModule removed)
    AppConfigStore,
    AppConfigService,
    BackgroundNotificationService,
    ValidationService,
    AuditService,
    AuditStore,
    TasksService,
    TaskStore,
    UsersService,
    UserStore,
    FactService,
    FactStore,
    DeviceService,
    DeviceStore,
    ConversationStateStore,
    ConversationStateService,
    TaskRequestsService,
    TaskRequestStore,
    UserPermissionsService,
    TaskRegistryService,
    LogStore,
    LogService,
    AIAuditStore,
    AIAuditService,
    NotificationService,
    NotificationStore,
  ],
  exports: [
    // Export everything needed by higher-level modules
    KNEX_CONNECTION,
    AppConfigService,
    BackgroundNotificationService,
    AppConfigStore,
    ValidationService,
    AuditService,
    TasksService,
    TaskStore,
    UsersService,
    UserStore,
    FactService,
    FactStore,
    DeviceService,
    DeviceStore,
    ConversationStateService,
    TaskRequestsService,
    UserPermissionsService,
    TaskRegistryService,
    LogService,
    AIAuditService,
    TransactionManager,
    NotificationService,
  ],
})
export class CoreModule {}
