// src/integrations/home-assistant/home-assistant.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { AppConfigService } from "../../core/services/app-config.service";
import { LogStore } from "../../core/stores/log/log.store";
import { DeviceStore } from "src/core/stores/device/device.store";
import { UserStore } from "src/core/stores/user/user.store";
import { HassEvent } from "./types/hass-event";
import {
  createConnection,
  subscribeEntities,
  callService,
  createLongLivedTokenAuth,
  type HassEntities,
  type HassEntity,
  type Connection,
} from "home-assistant-js-websocket";
import { User } from "@home-ai/shared/domain/user/user";
import { OrchestratorService } from "../../ai/orchestrator/orchestrator.service";

@Injectable()
export class HomeAssistantService implements OnModuleInit, OnModuleDestroy {
  private connection: Connection | null = null;
  private entities: HassEntities = {};

  private automationUserId: string;
  private automationUser: User | null = null;

  constructor(
    private readonly deviceStore: DeviceStore,
    private readonly appConfigService: AppConfigService,
    private readonly userStore: UserStore,
    private readonly orchestratorService: OrchestratorService,
    private readonly logStore: LogStore,
  ) {
    this.automationUserId =
      this.appConfigService.getFromEnv("AUTOMATION_USER_ID");
  }

  async onModuleInit() {
    await this.connect();
    this.automationUser = await this.userStore.getById(this.automationUserId);
  }

  onModuleDestroy() {
    this.connection?.close();
    this.connection = null;
  }

  private async connect() {
    try {
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

  private async handleStateChanged(event: HassEvent) {
    const entityId = event.event.data.entity_id;
    const newState = event.event.data.new_state;
    const oldState = event.event.data.old_state;
    // TODO:
    // Add some filtering here if this gets noisy.

    await this.logStore.create({
      severity: "debug",
      message: `HA state changed: ${entityId}`,
      metadata: {
        entityId,
        oldState: oldState?.state,
        newState: newState?.state,
      },
    });

    // Find matching logical devices for this entity
    const devices = await this.deviceStore.getAll();
    const matchingDevices = devices.filter((d) =>
      this.doesSlugMatchEntity(d.slug, entityId),
    );

    if (matchingDevices.length === 0) {
      await this.logStore.create({
        severity: "info",
        message: `No matching device found for entity ${entityId}`,
        metadata: { entityId },
      });
      return;
    }

    if (!this.automationUser) {
      await this.logStore.create({
        severity: "error",
        message: "Automation user is not loaded",
        metadata: { automationUserId: this.automationUserId },
      });
      return;
    }

    // Improved, clean LLM input
    const input = `Home Assistant state changed for device "${matchingDevices[0].slug}".

Old State: ${oldState?.state || "unknown"}
New State: ${newState?.state || "unknown"}

Key Attributes:
${JSON.stringify(newState?.attributes || {}, null, 2)}

Device Info:
- Slug: ${matchingDevices.map((d) => d.slug).join(", ")}
- Friendly Name: ${matchingDevices.map((d) => d.friendlyName).join(", ")}
- Room/Category: ${matchingDevices.map((d) => `${d.room || "—"} / ${d.category || "—"}`).join(", ")}

Please decide the appropriate action (notify user, update note, add to shopping list, etc.).`;

    await this.orchestratorService.handleEvent(this.automationUser, input, `automation:${matchingDevices[0].slug}`);
  }

  async getAllEntities(): Promise<HassEntity[]> {
    return Object.values(this.entities);
  }

  async getDeviceState(slug: string): Promise<any> {
    if (!this.connection) throw new Error("Not connected to Home Assistant");

    const matchingEntities = Object.values(this.entities).filter(
      (entity: HassEntity) => this.doesSlugMatchEntity(slug, entity.entity_id),
    );

    await this.logStore.create({
      severity: "debug",
      message: `Searched for device state using slug "${slug}"`,
      metadata: { slug, matchingEntityCount: matchingEntities.length },
    });

    return {
      deviceSlug: slug,
      entities: matchingEntities.map((e: any) => ({
        entityId: e.entity_id,
        state: e.state,
        attributes: e.attributes,
        lastChanged: e.last_changed,
      })),
      lastUpdated: new Date().toISOString(),
    };
  }

  async getState(entityId: string): Promise<HassEntity | null> {
    return this.entities[entityId] ?? null;
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

  private doesSlugMatchEntity(slug: string, entityId: string): boolean {
    return entityId.toLowerCase().includes(slug.toLowerCase());
  }
}
