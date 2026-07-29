import { InjectRedis } from "@nestjs-modules/ioredis";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import Redis from "ioredis";
import { DeviceStore } from "../../../core/stores/device/device.store";
import { OrchestratorService } from "../../../ai/orchestrator/orchestrator.service";
import { Job } from "bullmq";
import {
  AutomationRule,
  TriggerConfigDevice,
  TriggerType,
} from "@home-ai/shared/domain/automation-rule/automation-rule";
import type { Device } from "@home-ai/shared/domain/device/device";
import { LLMModelTypes } from "../../../ai/llm/llm.provider.sevice";
import { LogStore } from "../../../core/stores/monitoring/log/log.store";
import { UserStore } from "../../../core/stores/user/user.store";
import { OnModuleInit } from "@nestjs/common";
import { AppConfigService } from "../../../core/services/app-config.service";
import { User } from "@home-ai/shared/domain/user/user";
import { AutomationRuleStore } from "../../../core/stores/automation-rule/automation-rule.store";
import { HomeAssistantService } from "./home-assistant.service";
import { EventQueueBuffer, EventQueueItem } from "../types/event-queue";

type HaEntitySnapshot = {
  entityId: string;
  state: string;
  attributes: Record<string, any>;
};

@Processor("ha-events")
export class HomeAssistantProcessor extends WorkerHost implements OnModuleInit {
  private automationUserId: string;
  private automationUser: User;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly orchestratorService: OrchestratorService,
    private readonly deviceStore: DeviceStore,
    private readonly userStore: UserStore,
    private readonly logStore: LogStore,
    private readonly appConfigService: AppConfigService,
    private readonly automationRuleStore: AutomationRuleStore,
    private readonly homeAssistantService: HomeAssistantService,
  ) {
    super();

    this.automationUserId =
      this.appConfigService.getFromEnv("AUTOMATION_USER_ID");
  }

  async onModuleInit() {
    // Best-effort warm-up. If this races ahead of the DB being ready, process()
    // will lazily resolve the automation user before it is needed, so we don't
    // rethrow here — but we do log so a genuine misconfiguration is visible.
    try {
      await this.ensureAutomationUser();
    } catch (error: any) {
      await this.logStore.create({
        severity: "warn",
        message:
          "HomeAssistantProcessor: automation user warm-up failed; will retry lazily per job",
        metadata: {
          error: error?.message ?? String(error),
          automationUserId: this.automationUserId,
        },
      });
    }
  }

  /**
   * Resolves and caches the automation user. Guards against the startup race
   * where the BullMQ worker picks up an already-due job before onModuleInit has
   * populated `this.automationUser`. Throws a descriptive error if the
   * configured AUTOMATION_USER_ID genuinely matches no user.
   */
  private async ensureAutomationUser(): Promise<User> {
    if (this.automationUser) {
      return this.automationUser;
    }

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
    return this.automationUser;
  }

  async process(job: Job<{ deviceId: string }>): Promise<void> {
    await this.ensureAutomationUser();

    const redisKey = `ha_event:${job.data.deviceId}`;
    const rawBuffer = await this.redis.get(redisKey);
    const device = await this.deviceStore.getById(
      job.data.deviceId,
      this.automationUser,
      false,
    );
    if (!device || !rawBuffer) {
      await this.logStore.create({
        severity: "error",
        message:
          "Could not process device event: Device, Buffer, or Automation User not found",
        metadata: {
          deviceId: device?.id,
          buffer: rawBuffer,
          automationUserId: this.automationUser.id,
        },
      });
      return;
    }
    const buffer = JSON.parse(rawBuffer) as EventQueueBuffer;
    const automationRules = await this.automationRuleStore.getByIdsForAutomation(
      buffer.ruleIds,
      false,
    );
    const deviceState =
      await this.homeAssistantService.getDeviceStateAndServices(device.slug);

    await this.redis.del(redisKey);

    const fullDeviceState = deviceState.entities.map((entity) => ({
      entityId: entity.entityId,
      state: entity.state,
      attributes: entity.attributes,
    }));

    const byRuleOwnerId = new Map<string, AutomationRule[]>();
    for (const rule of automationRules) {
      const list = byRuleOwnerId.get(rule.userId) ?? [];
      list.push(rule);
      byRuleOwnerId.set(rule.userId, list);
    }

    for (const [ruleOwnerUserId, ownerRules] of byRuleOwnerId.entries()) {
      const ruleOwner = await this.userStore.getById(ruleOwnerUserId);
      if (!ruleOwner?.active) {
        await this.logStore.create({
          severity: "warn",
          message: `HomeAssistantProcessor: skip automation — rule owner missing or inactive`,
          metadata: {
            ruleOwnerUserId,
            deviceId: device.id,
            ruleIds: ownerRules.map((r) => r.id),
          },
        });
        continue;
      }

      const prompt = this.buildPrompt(
        device,
        ruleOwnerUserId,
        ownerRules,
        buffer.events,
        fullDeviceState,
      );

      await this.runOrchestrationForRuleOwner(
        device,
        ruleOwnerUserId,
        ownerRules,
        prompt,
      );
    }
  }

  /** Runs as `this.automationUser`. Caller validates rule owner. */
  private async runOrchestrationForRuleOwner(
    device: Device,
    ruleOwnerUserId: string,
    rules: AutomationRule[],
    prompt: string,
  ): Promise<void> {
    const automationUser = this.automationUser;
    if (!automationUser) {
      return;
    }

    try {
      await this.orchestratorService.handleEvent(
        automationUser,
        prompt,
        `automation:${device.slug}:${ruleOwnerUserId}`,
        LLMModelTypes.SOON,
        { suppressToolEvents: false },
      );

      await this.automationRuleStore.updateLastRun(rules.map((r) => r.id));
    } catch (error: any) {
      await this.logStore.create({
        userId: automationUser.id,
        severity: "error",
        message: `HomeAssistantProcessor: orchestration failed for device automation`,
        metadata: {
          error: error?.message ?? String(error),
          deviceId: device.id,
          ruleOwnerUserId,
          ruleIds: rules.map((r) => r.id),
        },
      });
    }
  }

  private buildPrompt(
    device: Device,
    ruleOwnerUserId: string,
    rules: AutomationRule[],
    stateChanges: EventQueueItem[],
    entitySnapshots: HaEntitySnapshot[],
  ): string {
    const dedupedStateChanges = new Map<string, EventQueueItem>();
    for (const change of stateChanges) {
      dedupedStateChanges.set(change.entityId, change);
    }
    const haTransitionChanges = Array.from(dedupedStateChanges.values())
      .map(
        (e) =>
          `- Entity: ${e.entityId}, Old state: ${e.oldState} → New state: ${e.newState}`,
      )
      .join("\n");

    const rulesPayload = rules.map((r) => ({
      ruleId: r.id,
      ruleName: r.name,
      description: r.description,
      triggerIntent:
        r.trigger.type === TriggerType.DEVICE
          ? (r.trigger as TriggerConfigDevice).intent
          : undefined,
      actions: r.actions.map((a) => ({
        actionId: a.id,
        type: a.type,
        instruction: a.instruction,
        metadata: a.metadata,
        conditionOverride: a.conditionOverride,
      })),
    }));

    return [
      "## System role",
      "You are the orchestration engine for Home AI. Evaluate this Home Assistant state transition and execute only valid rule-based actions for the listed automation rules.",
      "",
      "## End-user for this batch",
      `Rule owner user id: ${ruleOwnerUserId}. Notifications, tasks, and other actions must target this user unless tools encode scope explicitly.`,
      "",
      "## Context: Home Assistant state transition",
      `Device: "${device.friendlyName}" (${device.slug}), id ${device.id}. Current time: ${new Date().toISOString()}.`,
      "",
      "## Changes",
      haTransitionChanges,
      "",
      `## Current state\n${JSON.stringify(entitySnapshots, null, 2)}`,
      "",
      "## Automation rules",
      JSON.stringify(rulesPayload, null, 2),
      "",
      "## Objective",
      "Evaluate the event and execute only valid rule-based actions.",
      "",
      "1. Match rules strictly:",
      "   - A rule is eligible only if its trigger matches this event exactly.",
      "   - DEVICE match requires:",
      `     - rule.trigger.type = "${TriggerType.DEVICE}"`,
      `     - rule.trigger.deviceId = "${device.id}"`,
      "",
      "2. Ignore noise:",
      "   - Do not react to insignificant state jitter.",
      "   - Only react when the transition is meaningful for the rule intent.",
      "",
      "3. Execute actions:",
      "   - Execute only actions defined in matched rules.",
      "   - Do not invent tools, fields, or rule logic.",
      "   - For notifications, use the rule instructions and include relevant current values.",
      "   - For tasks, call the explicit tool required by the rule action.",
      "",
      "4. Safety:",
      "   - If no rule matches, call no tools.",
      "   - If required fields are missing or ambiguous, skip and explain briefly.",
      "",
      "Be concise; prioritize safety and convenience.",
    ].join("\n");
  }
}
