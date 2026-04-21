import { Module } from '@nestjs/common';
import { AppConfigService } from './entities/app-config/app-config.service';
import { ValidationService } from './validation/validation.service';
import { AuditService } from './entities/monitoring/audit/audit.service';

import { TasksService } from './entities/task/tasks.service';
import { TaskStore } from './entities/task/task.store';
import { TaskAdminController } from './entities/task/task-admin.controller';
import { TaskController } from './entities/task/task.controller';

import { UsersService } from './entities/user/user.service';
import { UserStore } from './entities/user/user.store';
import { UserAdminController } from './entities/user/user-admin.controller';
import { UserController } from './entities/user/user.controller';

import { FactService } from './fact/fact.service';
import { FactStore } from './fact/fact.store';
import { FactAdminController } from './fact/fact-admin.controller';
import { FactController } from './fact/fact.controller';

import { DeviceService } from './entities/device/device.service';
import { DeviceStore } from './entities/device/device.store';

import { ConversationStateService } from './entities/conversation-state/conversation-state.service';

import { TaskRequestsService } from './entities/task-request/task-requests.service';
import { TaskRequestAdminController } from './entities/task-request/task-request-admin.controller';
import { TaskRequestController } from './entities/task-request/task-request.controller';
import { Knex } from 'knex';
import knexConfig from '../../knexfile';
import { KNEX_CONNECTION } from './database/knex.constants';
import { ConfigService } from '@nestjs/config';
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
import { NotificationAdminController } from './entities/notification/notification-admin.controller';
import { AuditAdminController } from './entities/monitoring/audit/audit-admin.controller';
import { AIAuditAdminController } from './entities/monitoring/ai-audit/ai-audit-admin.controller';
import { LogAdminController } from './entities/monitoring/log/log-admin.controller';
import { DeviceAdminController } from './entities/device/device-admin.controller';
import { DeviceController } from './entities/device/device.controller';
import { AppConfigAdminController } from './entities/app-config/app-config-admin.controller';

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
    TaskAdminController,
    TaskController,
    UserAdminController,
    UserController,
    TaskRequestAdminController,
    TaskRequestController,
    NotificationAdminController,
    AuditAdminController,
    AIAuditAdminController,
    LogAdminController,
    DeviceAdminController,
    DeviceController,
    FactAdminController,
    FactController,
    AppConfigAdminController,
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

        return require('knex')(config);
      },
      inject: [ConfigService],        // Use NestJS built-in ConfigService
    },
    TransactionManager,

    // Config/Audit services provided directly (ConfigModule and AuditModule removed)
    AppConfigStore,
    AppConfigService,
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
    NotificationStore,
  ],
})
export class CoreModule {}
