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
import { DeviceEventStore } from "../../../core/stores/device/device-event.store";
import { DeviceStatus } from "@home-ai/shared/domain/device/device-status";
import { User } from "../../../../../shared/dist/domain/user/user";
import { UserStore } from "../../../core/stores/user/user.store";
import { HomeAssistantProcessor } from "./home-assistant-processor.service";
import { Trace } from "../../../common/decorators/trace.decorator";
import { currentTraceId } from "../../../common/trace-id";

const HA_HTTP_MAX_BYTES = 8 * 1024 * 1024;

export type HomeAssistantHttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface HomeAssistantHttpRequest {
  path: string;
  method?: HomeAssistantHttpMethod;
  body?: unknown;
}

export interface HomeAssistantHttpResponse {
  status: number;
  contentType: string | null;
  body: Buffer;
}

@Injectable()
export class HomeAssistantService implements OnModuleInit, OnModuleDestroy {
  private connection: Connection | null = null;
  private entities: HassEntities = {};
  private services: HassServices = {};
  private automationUserId: string;
  private automationUser: User;

  constructor(
    private readonly deviceStore: DeviceStore,
    private readonly appConfigService: AppConfigService,
    private readonly logStore: LogStore,
    private readonly automationRuleStore: AutomationRuleStore,
    private readonly deviceEventStore: DeviceEventStore,
    private readonly userStore: UserStore,
    private readonly homeAssistantProcessor: HomeAssistantProcessor,
  ) {
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
        `HomeAssistantService: AUTOMATION_USER_ID "${this.automationUserId}" does not match any user`,
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
        traceId: currentTraceId(),
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

    if (HomeAssistantUtils.isIgnoredEntity(matchingDevice, entityId)) {
      await this.logStore.create({
        traceId: currentTraceId(),
        severity: "info",
        message: `Ignored entity ${entityId} for device ${matchingDevice.id}; automation skipped`,
        metadata: { deviceId: matchingDevice.id, entityId },
      });
      return;
    }

    const newStateValue = newState?.state || "unknown";
    if (HomeAssistantUtils.isOffStateSkipped(matchingDevice, newStateValue)) {
      await this.logStore.create({
        traceId: currentTraceId(),
        severity: "info",
        message: `Off state for ${entityId} on device ${matchingDevice.id}; automation skipped`,
        metadata: { deviceId: matchingDevice.id, entityId, newState: newStateValue },
      });
      return;
    }

    const automationRules =
      await this.getStateChangeAutomationRules(matchingDevice);
    if (automationRules.length === 0) {
      await this.logStore.create({
        traceId: currentTraceId(),
        severity: "info",
        message: `No valid automation rules found for device ${matchingDevice.id}`,
        metadata: { deviceId: matchingDevice.id },
      });
      return;
    }

    const deviceState = await this.getDeviceStateAndServices(
      matchingDevice.slug,
    );
    const entitySnapshots = deviceState.entities.map((entity) => ({
      entityId: entity.entityId,
      state: entity.state,
      attributes: entity.attributes,
    }));

    // Process immediately (no BullMQ delay). Do not block the HA event loop.
    void this.homeAssistantProcessor
      .processDeviceEvent(
        matchingDevice,
        automationRules,
        {
          entityId,
          oldState: oldState?.state || "unknown",
          newState: newState?.state || "unknown",
        },
        entitySnapshots,
      )
      .catch(async (error: any) => {
        await this.logStore.create({
          traceId: currentTraceId(),
          severity: "error",
          message: `Failed to process device automation for ${matchingDevice.id}`,
          metadata: {
            deviceId: matchingDevice.id,
            entityId,
            error: error?.message ?? String(error),
          },
        });
      });
  }

  @Trace()
  async getAllEntities(): Promise<HassEntity[]> {
    return Object.values(this.entities);
  }

  @Trace()
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

  @Trace()
  async callService(domain: string, service: string, serviceData: any = {}) {
    if (!this.connection) throw new Error("Not connected to Home Assistant");

    await this.logStore.create({
      traceId: currentTraceId(),
      severity: "info",
      message: `Calling HA service ${domain}.${service}`,
      metadata: { domain, service, serviceData },
    });

    return callService(this.connection, domain, service, serviceData);
  }

  /**
   * HTTP request to this Home Assistant instance.
   * `path` is a path such as `/api/states`, or an absolute URL on the same origin.
   */
  @Trace()
  async request(input: HomeAssistantHttpRequest): Promise<HomeAssistantHttpResponse> {
    const method = input.method ?? "GET";
    const raw = this.appConfigService.getFromEnv<string>("HOME_ASSISTANT_URL");
    const origin = new URL(raw.replace(/^ws(s)?:\/\//, "http$1://")).origin;
    const trimmed = input.path.trim();
    let url: URL;
    try {
      url = trimmed.startsWith("/")
        ? new URL(trimmed, `${origin}/`)
        : new URL(trimmed);
    } catch {
      throw new Error("Home Assistant path or URL is invalid.");
    }
    if (url.origin !== origin) {
      throw new Error("URL must point at this Home Assistant instance.");
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.appConfigService.getFromEnv<string>("HOME_ASSISTANT_TOKEN")}`,
    };
    let body: string | undefined;
    if (input.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = typeof input.body === "string" ? input.body : JSON.stringify(input.body);
    }

    const response = await fetch(url, {
      method,
      headers,
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });
    if (response.status >= 300 && response.status < 400) {
      throw new Error(
        `Home Assistant redirect was not followed for ${method} ${url.pathname}`,
      );
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > HA_HTTP_MAX_BYTES) {
      throw new Error("Home Assistant response is larger than 8 MB.");
    }

    await this.logStore.create({
      traceId: currentTraceId(),
      severity: "info",
      message: `Home Assistant HTTP ${method} ${url.pathname}`,
      metadata: { method, pathname: url.pathname, status: response.status },
    });

    return {
      status: response.status,
      contentType: response.headers.get("content-type"),
      body: bytes,
    };
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
        traceId: currentTraceId(),
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
        traceId: currentTraceId(),
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
    return HomeAssistantUtils.filterAutomationRules(automationRules);
  }
  // #endregion State Change Utils
}
