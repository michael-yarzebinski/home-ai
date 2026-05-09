// src/integrations/home-assistant/home-assistant.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { AppConfigService } from "../../../core/services/app-config.service";
import { LogStore } from "../../../core/stores/monitoring/log/log.store";
import { DeviceStore } from "src/core/stores/device/device.store";
import { HassEvent } from "../types/hass-event";
import {
  createConnection,
  subscribeEntities,
  callService,
  createLongLivedTokenAuth,
  type HassEntities,
  type HassEntity,
  type Connection,
  subscribeServices,
  HassServices,
} from "home-assistant-js-websocket";
import * as WS from "ws";
import { AutomationRuleStore } from "../../../core/stores/automation-rule/automation-rule.store";
import { Device } from "@home-ai/shared/domain/device/device";
import { AutomationRule } from "@home-ai/shared/domain/automation-rule/automation-rule";
import { HomeAssistantUtils } from "../utils/home-assistant.utils";
import Redis from "ioredis";
import { InjectRedis } from "@nestjs-modules/ioredis";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { EventQueueBuffer, EventQueueItem } from "../types/event-queue";
import { DeviceEventStore } from "../../../core/stores/device/device-event.store";
import { DeviceStatus } from "@home-ai/shared/domain/device/device-status";
import { User } from "../../../../../shared/dist/domain/user/user";
import { UserStore } from "../../../core/stores/user/user.store";

@Injectable()
export class HomeAssistantService implements OnModuleInit, OnModuleDestroy {
  private connection: Connection | null = null;
  private entities: HassEntities = {};
  private services: HassServices = {};
  private automationUserId: string;
  private automationUser: User;

  private deviceCooldownMinutes: number;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    @InjectQueue("ha-events") private readonly queue: Queue,
    private readonly deviceStore: DeviceStore,
    private readonly appConfigService: AppConfigService,
    private readonly logStore: LogStore,
    private readonly automationRuleStore: AutomationRuleStore,
    private readonly deviceEventStore: DeviceEventStore,
    private readonly userStore: UserStore,
  ) {
    this.deviceCooldownMinutes = this.appConfigService.getFromEnv<number>(
      "HOME_ASSISTANT_DEVICE_COOLDOWN_MINUTES",
    );
    this.automationUserId =
      this.appConfigService.getFromEnv("AUTOMATION_USER_ID");
  }

  async onModuleInit() {
    await this.connect();
    const automationUser = await this.userStore.getById(
      this.automationUserId,
      undefined,
      false,
    );
    if (!automationUser) {
      throw new Error(
        `HomeAssistantProcessor: AUTOMATION_USER_ID "${this.automationUserId}" does not match any user`,
      );
    }
    this.automationUser = automationUser;
  }

  onModuleDestroy() {
    this.connection?.close();
    this.connection = null;
  }

  private async handleStateChanged(event: HassEvent) {
    const entityId = event.data.entity_id;
    const newState = event.data.new_state;
    const oldState = event.data.old_state;

    const matchingDevice = await this.getStateChangeDevice(entityId);
    if (!matchingDevice) {
      await this.logStore.create({
        severity: "info",
        message: `No matching device found for entity ${entityId}`,
        metadata: { entityId },
      });
      return;
    }

    await this.deviceEventStore.create({
      deviceId: matchingDevice.id,
      entityId,
      oldState: oldState?.state || "unknown",
      newState: newState?.state || "unknown",
      metadata: {
        attributes: event.data.new_state.attributes,
      },
    });

    const automationRules =
      await this.getStateChangeAutomationRules(matchingDevice);
    if (automationRules.length === 0) {
      await this.logStore.create({
        severity: "info",
        message: `No valid automation rules found for device ${matchingDevice.id}`,
        metadata: { deviceId: matchingDevice.id },
      });
      return;
    }

    await this.addItemToQueue(matchingDevice.id, {
      ruleIds: automationRules.map((rule) => rule.id),
      entityId,
      oldState: oldState?.state || "unknown",
      newState: newState?.state || "unknown",
    });
  }

  async getAllEntities(): Promise<HassEntity[]> {
    return Object.values(this.entities);
  }

  async getDeviceStateAndServices(slug: string): Promise<DeviceStatus> {
    if (!this.connection) throw new Error("Not connected to Home Assistant");

    const matchingEntities = Object.values(this.entities).filter(
      (entity: HassEntity) =>
        HomeAssistantUtils.doesDeviceSlugMatchEntityId(slug, entity.entity_id),
    );

    return {
      deviceSlug: slug,
      entities: matchingEntities.map((e: any) => {
        const domain = e.entity_id.split(".")[1]
          ? e.entity_id.split(".")[0]
          : null;

        return {
          entityId: e.entity_id,
          state: e.state,
          attributes: e.attributes,
          lastChanged: e.last_changed,
          services: this.services[domain] || {},
        };
      }),
      lastUpdated: new Date().toISOString(),
    };
  }

  async callService(domain: string, service: string, serviceData: any = {}) {
    if (!this.connection) throw new Error("Not connected to Home Assistant");

    await this.logStore.create({
      severity: "info",
      message: `Calling HA service ${domain}.${service}`,
      metadata: { domain, service, serviceData },
    });

    return callService(this.connection, domain, service, serviceData);
  }

  private async connect() {
    try {
      // home-assistant-js-websocket expects a global WebSocket in Node runtime.
      if (!(globalThis as any).WebSocket) {
        const WebSocketCtor = (WS as any).WebSocket ?? (WS as any);
        (globalThis as any).WebSocket = WebSocketCtor;
      }

      const url =
        this.appConfigService.getFromEnv<string>("HOME_ASSISTANT_URL");
      const token = this.appConfigService.getFromEnv<string>(
        "HOME_ASSISTANT_TOKEN",
      );

      const auth = createLongLivedTokenAuth(
        url.replace(/^ws(s)?:\/\//, "http$1://"),
        token,
      );

      this.connection = await createConnection({ auth });

      await this.logStore.create({
        severity: "info",
        message: "Connected to Home Assistant WebSocket",
        metadata: { url },
      });

      subscribeEntities(this.connection, (entities: HassEntities) => {
        this.entities = entities;
      });

      subscribeServices(this.connection, (services: HassServices) => {
        this.services = services;
      });

      this.connection.subscribeEvents(
        (event: HassEvent) => this.handleStateChanged(event),
        "state_changed",
      );
    } catch (err: any) {
      await this.logStore.create({
        severity: "error",
        message: "Failed to connect to Home Assistant WebSocket",
        metadata: { error: err.message },
      });
    }
  }

  // #region State Change Utils
  private async getStateChangeDevice(
    entityId: string,
  ): Promise<Device | undefined> {
    const devices = await this.deviceStore.getAll();
    return HomeAssistantUtils.getMatchingDeviceByEntityId(devices, entityId);
  }

  private async getStateChangeAutomationRules(
    device: Device,
  ): Promise<AutomationRule[]> {
    const automationRules = await this.automationRuleStore.getForDevice(
      device.id,
    );
    return HomeAssistantUtils.filterAutomationRules(
      automationRules,
      device,
      this.deviceCooldownMinutes,
    );
  }

  private async addItemToQueue(
    deviceId: string,
    context: EventQueueItem,
  ): Promise<void> {
    const redisKey = `ha_event:${deviceId}`;

    const existing = await this.redis.get(redisKey);
    let buffer = existing
      ? (JSON.parse(existing) as EventQueueBuffer)
      : { events: [], ruleIds: [] };
    buffer.events.push(context);
    buffer.ruleIds = Array.from(
      new Set([...buffer.ruleIds, ...context.ruleIds]),
    );
    await this.redis.set(redisKey, JSON.stringify(buffer));

    const existingJob = await this.queue.getJob(deviceId);

    if (existingJob) {
      return;
    }

    await this.queue.add(
      "process-batch",
      { deviceId },
      {
        jobId: deviceId,
        delay: this.deviceCooldownMinutes * 60 * 1000,
        removeOnComplete: true,
      },
    );
  }
  // #endregion State Change Utils
}
