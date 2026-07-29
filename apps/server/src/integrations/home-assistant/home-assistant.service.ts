// src/integrations/home-assistant/home-assistant.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { SchedulerRegistry } from '@nestjs/schedule';
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
  subscribeServices,
  HassServices,
} from "home-assistant-js-websocket";
import { User } from "@home-ai/shared/domain/user/user";
import { OrchestratorService } from "../../ai/orchestrator/orchestrator.service";
import * as WS from "ws";
import { LLMModelTypes } from "../../ai/llm/llm.provider.sevice";
import { AutomationRuleStore } from "../../core/stores/automation-rule/automation-rule.store";
import { Device } from '@home-ai/shared/domain/device/device';
import { TriggerConfigDevice } from '@home-ai/shared/domain/automation-rule/automation-rule';
import { HomeAssistantUtils } from "./utils/home-assistant.utils";
import { AutomationRule } from '@home-ai/shared/domain/automation-rule/automation-rule';


interface EventQueueItem {
  entityId: string;
  oldState: string;
  newState: string;
  ruleIds: string[];
}

type StateChangeContextResult = {
  shouldContinue: true;
  device: Device;
  ruleIds: string[];
} | {
  shouldContinue: false;
  severity: "info" | "error" | "debug";
  reason: string;
};

@Injectable()
export class HomeAssistantService implements OnModuleInit, OnModuleDestroy {
  private connection: Connection | null = null;
  private entities: HassEntities = {};
  private services: HassServices = {};

  private automationUserId: string;
  private automationUser: User | null = null;

  private eventQueue = new Map<string, EventQueueItem[]>();

  private deviceCooldownMinutes: number;

  constructor(
    private readonly deviceStore: DeviceStore,
    private readonly appConfigService: AppConfigService,
    private readonly userStore: UserStore,
    private readonly orchestratorService: OrchestratorService,
    private readonly logStore: LogStore,
    private schedulerRegistry: SchedulerRegistry,
    private readonly automationRuleStore: AutomationRuleStore,
  ) {
    this.automationUserId =
      this.appConfigService.getFromEnv("AUTOMATION_USER_ID");
    this.deviceCooldownMinutes = this.appConfigService.getFromEnv<number>("HOME_ASSISTANT_DEVICE_COOLDOWN_MINUTES");
  }

  async onModuleInit() {
    await this.connect();
    this.automationUser = await this.userStore.getById(this.automationUserId);
  }

  onModuleDestroy() {
    this.connection?.close();
    this.connection = null;
  }

  private async handleStateChanged(event: HassEvent) {
    const entityId = event.data.entity_id;
    const newState = event.data.new_state;
    const oldState = event.data.old_state;

    const context = await this.getStateChangeContext(
      entityId,
      oldState?.state,
      newState?.state,
    );
    if (!context.shouldContinue) {
      await this.logStore.create({
        severity: context.severity,
        message: context.reason,
        metadata: { entityId },
      });
      return;
    }

    const matchingDevice = context.device;
    this.addItemToQueue(
      matchingDevice.id,
      {
        ruleIds: context.ruleIds,
        entityId,
        oldState: oldState?.state || "unknown",
        newState: newState?.state || "unknown",
      },
    );
  }



  private doesTimeoutExist(id: string): boolean {
    try {
      this.schedulerRegistry.getTimeout(id);
      return true;
    } catch {
      return false;
    }
  }

  private async handleEventQueue(id: string): Promise<void> {
    const events = this.eventQueue.get(id);
    if (!events) {
      await this.logStore.create({
        severity: "error",
        message: "Events not found",
        metadata: { id },
      });
      return;
    }
    this.removeItemFromQueue(id);

    const device = (await this.deviceStore.getById(id))!;

    const automationRuleIds = Array.from(
      new Set(events.flatMap((event) => event.ruleIds)),
    );
    const loadedRules = await this.automationRuleStore.getByIds(automationRuleIds);
    // Re-check cooldown at flush time so concurrent events cannot re-run the same rules.
    const automationRules = HomeAssistantUtils.filterAutomationRules(
      loadedRules,
      device,
      this.deviceCooldownMinutes,
    );

    if (automationRules.length === 0) {
      await this.logStore.create({
        severity: "info",
        message: `Skipping automation flush — all rules for device ${device.slug} are on cooldown`,
        metadata: { deviceId: device.id, ruleIds: automationRuleIds },
      });
      return;
    }

    // Stamp lastRun before the LLM call so subsequent HA events are filtered immediately.
    await this.automationRuleStore.markRulesRan(automationRules.map((rule) => rule.id));

    const deviceState = await this.getDeviceStateAndServices(device.slug);

    const entitiesCurrentState = events.reduce((acc, e) => {
      const entity = deviceState.entities.find(es => es.entityId === e.entityId);
      if (!entity) {
        return acc;
      }

      acc.set(entity.entityId, {
        entityId: entity.entityId,
        state: entity.state,
        attributes: entity.attributes,
      });

      return acc;
    }, new Map<string, {
      entityId: string,
      state: string,
      attributes: Record<string, any>,
    }>());

    const automationRulesPrompt = automationRules.map(ar => `Name: ${ar.name}User ID: ${ar.userId}\nDescription: ${ar.description}\nTrigger: ${(ar.trigger as TriggerConfigDevice).intent}\nActions: ${ar.actions.map(a => `Instruction: ${a.instruction}\n Metadata: ${JSON.stringify(a.metadata)}`).join("\n")}`).join("\n");

    const prompt = `
    ## System Role
    You are the Orchestration Engine for "Home AI." Your goal is to evaluate real-time IoT state transitions and execute the appropriate reactions (Notifications or Tasks) based on user-defined preferences.

    ## Context: Home Assistant State Transition
    The device "${device.friendlyName}" (${device.slug}) has changed state.  Current time is ${new Date().toISOString()}.

    ## Changes
    ${events.map((e) => `- Old State: ${e.oldState} - New State: ${e.newState}`).join("\n")}

    ## Current State
    ${JSON.stringify(Array.from(entitiesCurrentState.values()))}

    ## Automation Rules
    ${automationRulesPrompt}

    ## Objective
    Evaluate the event and execute only valid rule-based actions.

    1. Match rules strictly:
      - A rule is eligible only if its trigger matches this event exactly.
      - DEVICE match requires:
        - rule.trigger.type = "DEVICE"
        - rule.trigger.deviceId = "${device.slug}"

    2. Ignore noise:
      - Do not react to insignificant state jitter.
      - Only react when transition is meaningful for the rule intent.

    3. Execute actions:
      - Execute only actions defined in matched rules.
      - Do not invent tools, fields, or rule logic.
      - For notifications, use the rule message/instructions and include relevant current values.
      - For tasks, call the explicit tool required by the rule action.

    4. Safety behavior:
      - If no rule matches, call no tools.
      - If required fields are missing or ambiguous, skip and explain briefly.
    
    Decision Logic: Concise. Prioritize safety and convenience.
    `;

    await this.orchestratorService.handleEvent(this.automationUser!, prompt, `automation:${device.slug}`, LLMModelTypes.SOON);
  }

  async getAllEntities(): Promise<HassEntity[]> {
    return Object.values(this.entities);
  }

  async getDeviceStateAndServices(slug: string) {
    if (!this.connection) throw new Error("Not connected to Home Assistant");

    const matchingEntities = Object.values(this.entities).filter(
      (entity: HassEntity) => HomeAssistantUtils.doesDeviceSlugMatchEntityId(slug, entity.entity_id),
    );

    return {
      deviceSlug: slug,
      entities: matchingEntities.map((e: any) => {
        const domain = e.entity_id.split('.')[1] ? e.entity_id.split('.')[0] : null;

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
      });;

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
  private async getStateChangeContext(
    entityId: string,
    oldState?: string,
    newState?: string,
  ): Promise<StateChangeContextResult> {
    await this.logStore.create({
      severity: "debug",
      message: `HA state changed: ${entityId}`,
      metadata: {
        entityId,
        oldState,
        newState,
      },
    });

    const devices = await this.deviceStore.getAll();
    const matchingDevice = HomeAssistantUtils.getMatchingDeviceByEntityId(devices, entityId);

    if (!matchingDevice) {
      return { shouldContinue: false, severity: "info", reason: `No matching device found for entity ${entityId}` };
    }

    const automationRules = await this.automationRuleStore.getForDevice(matchingDevice.id);
    const filteredAutomationRules = HomeAssistantUtils.filterAutomationRules(automationRules, matchingDevice, this.deviceCooldownMinutes);
    if (filteredAutomationRules.length === 0) {
      return { shouldContinue: false, severity: "info", reason: `No valid automation rules found for device ${matchingDevice.id}` };
    }

    if (!this.automationUser) {
      return { shouldContinue: false, severity: "error", reason: `Automation user is not found` };
    }

    return {
      shouldContinue: true,
      device: matchingDevice,
      ruleIds: filteredAutomationRules.map((rule) => rule.id),
    };
  }

  private addItemToQueue(
    deviceId: string,
    context: EventQueueItem,
  ): void {
    const waitingEvents: EventQueueItem[] = this.eventQueue.get(deviceId) || [];

    waitingEvents.push(context);

    this.eventQueue.set(deviceId, waitingEvents);

    // No debounce delay: coalesce only events already in this tick (setTimeout 0),
    // then flush. Rule cooldown (lastRun) owns LLM throttling.
    const timeoutName = `buffer_${deviceId}`;
    if (!this.doesTimeoutExist(timeoutName)) {
      const timeout = setTimeout(() => {
        this.handleEventQueue(deviceId);
      }, 0);
      this.schedulerRegistry.addTimeout(timeoutName, timeout);
    }
  }

  private removeItemFromQueue(deviceId: string): void {
    this.eventQueue.delete(deviceId);
    this.schedulerRegistry.deleteTimeout(`buffer_${deviceId}`);
  }
  // #endregion State Change Utils
}
