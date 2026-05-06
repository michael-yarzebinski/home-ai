import { Module } from "@nestjs/common";
import { AuditStore } from "./stores/audit/audit.store";
import { AIAuditStore } from "./stores/ai-audit/ai-audit.store";
import { LogStore } from "./stores/log/log.store";
import { NotificationLogStore } from "./stores/notification-log/notification-log.store";
import { NotificationQueueStore } from "./stores/notification-queue/notification-queue.store";
import { ToolStore } from "./stores/tool/tool.store";
import { UserStore } from "./stores/user/user.store";
import { DeviceStore } from "./stores/device/device.store";
import { CalendarStore } from "./stores/calendar/calendar.store";
import { NoteStore } from "./stores/note/note.store";
import { PendingActionStore } from "./stores/pending-action/pending-action.store";
import { AppConfigService } from "./services/app-config.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AppConfigStore } from "./stores/app-config/app-config.store";
import knex, { Knex } from "knex";
import * as pg from "pg";
import { ConversationStore } from "./stores/conversation/conversation.store";
import { NotificationService } from "./services/notification.service";
import { DashboardService } from "./services/dashboard.service";
import { AuthService } from "./services/auth.service";
import { AutomationRuleStore } from "./stores/automation-rule/automation-rule.store";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./auth/jwt.strategy";
import { AuthController } from "./controllers/auth.controller";
import { AutomationRulesController } from "./controllers/automation-rules.controller";
import { ChatSessionsController } from "./controllers/chat-sessions.controller";
import { PendingActionsController } from "./controllers/pending-actions.controller";
import { DeviceEventStore } from "./stores/device/device-event.store";
import { BullModule } from "@nestjs/bullmq";

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '12h' },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'ha-events',
    }),
  ],
  controllers: [AuthController, AutomationRulesController, ChatSessionsController, PendingActionsController],
  providers: [
    {
      provide: "KNEX_CONNECTION",
      useFactory: (configService: ConfigService) => {
        // 1. Set parsers on the PG module directly
        // JSONB OID is 3802, JSON OID is 114
        pg.types.setTypeParser(3802, (val) => (val ? JSON.parse(val) : val));
        pg.types.setTypeParser(114, (val) => (val ? JSON.parse(val) : val));

        const knexConfig: Knex.Config = {
          client: "pg",
          connection: {
            host: configService.get<string>("DB_HOST"),
            port: configService.get<number>("DB_PORT"),
            user: configService.get<string>("DB_USER"),
            password: configService.get<string>("DB_PASSWORD"),
            database: configService.get<string>("DB_NAME"),
          },
          pool: { min: 2, max: 10 },
        };

        const instance = knex(knexConfig);

        // 2. Use a 'start' event instead of 'query' for Knex 3.1
        // This is more reliable for modifying bindings before they are sent
        instance.on("start", (builder) => {
          if (builder && builder._single && builder._single.insert) {
            // Knex 3.x internal structure check
          }
        });

        // 3. The fallback: if 'start' is too deep, stay with 'query' but
        // make it idempotent (safe for multiple reloads)
        instance.on("query", (query: any) => {
          if (
            ["update", "insert"].includes(query.method) &&
            Array.isArray(query.bindings)
          ) {
            for (let i = 0; i < query.bindings.length; i++) {
              if (Array.isArray(query.bindings[i])) {
                query.bindings[i] = JSON.stringify(query.bindings[i]);
              }
            }
          }
        });

        return instance;
      },
      inject: [ConfigService],
    },
    AppConfigStore,
    AuditStore,
    AIAuditStore,
    ConversationStore,
    LogStore,
    NotificationLogStore,
    NotificationQueueStore,
    ToolStore,
    UserStore,
    DeviceStore,
    CalendarStore,
    NoteStore,
    PendingActionStore,
    AutomationRuleStore,

    AppConfigService,
    AuthService,
    DashboardService,
    JwtStrategy,
    NotificationService,
    DeviceEventStore,
  ],
  exports: [
    "KNEX_CONNECTION",
    BullModule,
    AppConfigStore,
    AuditStore,
    AIAuditStore,
    ConversationStore,
    LogStore,
    NotificationLogStore,
    NotificationQueueStore,
    ToolStore,
    UserStore,
    DeviceStore,
    CalendarStore,
    NoteStore,
    PendingActionStore,
    AutomationRuleStore,

    AppConfigService,
    AuthService,
    DashboardService,
    JwtModule,
    NotificationService,
    DeviceEventStore,
  ],
})
export class CoreModule { }
