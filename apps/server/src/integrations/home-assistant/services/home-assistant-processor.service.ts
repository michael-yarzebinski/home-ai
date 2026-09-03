import { Injectable, OnModuleInit } from "@nestjs/common";
import { OrchestratorService } from "../../../ai/orchestrator/orchestrator.service";
import {
  AutomationRule,
  TriggerConfigDevice,
  TriggerType,
} from "@home-ai/shared/domain/automation-rule/automation-rule";
import type { Device } from "@home-ai/shared/domain/device/device";
import { LLMModelType } from "@home-ai/shared/domain/llm/llm-model-type";
import { LLMModelTypes } from "../../../ai/llm/llm.provider.sevice";
import { LogStore } from "../../../core/stores/monitoring/log/log.store";
import { UserStore } from "../../../core/stores/user/user.store";
import { AppConfigService } from "../../../core/services/app-config.service";
import { User } from "@home-ai/shared/domain/user/user";
import { AutomationRuleStore } from "../../../core/stores/automation-rule/automation-rule.store";
import { Trace } from "../../../common/decorators/trace.decorator";

export type DeviceStateChange = {
  entityId: string;
  oldState: string;
  newState: string;
};

export type HaEntitySnapshot = {
  entityId: string;
  state: string;
  attributes: Record<string, any>;
};

/**
 * Runs DEVICE automation rules immediately for a Home Assistant state change.
 * No queue, buffer, or coalesce window — rule cooldown remains the only rate limit.
 */
@Injectable()
export class HomeAssistantProcessor implements OnModuleInit {
  private automationUserId: string;
  private automationUser: User;

  constructor(
    private readonly orchestratorService: OrchestratorService,
    private readonly userStore: UserStore,
    private readonly logStore: LogStore,
    private readonly appConfigService: AppConfigService,
    private readonly automationRuleStore: AutomationRuleStore,
  ) {
    this.automationUserId =
      this.appConfigService.getFromEnv("AUTOMATION_USER_ID");
  }

  async onModuleInit() {
    try {
      await this.ensureAutomationUser();
    } catch (error: any) {
      await this.logStore.create({
        severity: "warn",
        message:
          "HomeAssistantProcessor: automation user warm-up failed; will retry lazily",
        metadata: {
          error: error?.message ?? String(error),
          automationUserId: this.automationUserId,
        },
      });
    }
  }

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

  /**
   * Process a single device state change immediately for the given rules.
   * Fire-and-forget safe: callers may void the returned promise.
   */
  @Trace()
  async processDeviceEvent(
    device: Device,
    rules: AutomationRule[],
    stateChange: DeviceStateChange,
    entitySnapshots: HaEntitySnapshot[],
  ): Promise<void> {
    if (rules.length === 0) {
      return;
    }

    await this.ensureAutomationUser();

    const byRuleOwnerId = new Map<string, AutomationRule[]>();
    for (const rule of rules) {
      const list = byRuleOwnerId.get(rule.userId) ?? [];
      list.push(rule);
      byRuleOwnerId.set(rule.userId, list);
    }

    const modelType = this.resolveModelType(device);

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
        stateChange,
        entitySnapshots,
      );

      await this.runOrchestrationForRuleOwner(
        device,
        ruleOwnerUserId,
        ownerRules,
        prompt,
        modelType,
      );
    }
  }

  private resolveModelType(device: Device): LLMModelTypes {
    if (device.llmModelType === LLMModelType.IMMEDIATE) {
      return LLMModelTypes.IMMEDIATE;
    }
    if (device.llmModelType === LLMModelType.SOON) {
      return LLMModelTypes.SOON;
    }
    return LLMModelTypes.SOON;
  }

  private async runOrchestrationForRuleOwner(
    device: Device,
    ruleOwnerUserId: string,
    rules: AutomationRule[],
    prompt: string,
    modelType: LLMModelTypes,
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
        modelType,
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
          llmModelType: modelType,
        },
      });
    }
  }

  private buildPrompt(
    device: Device,
    ruleOwnerUserId: string,
    rules: AutomationRule[],
    stateChange: DeviceStateChange,
    entitySnapshots: HaEntitySnapshot[],
  ): string {
    const haTransitionChanges = `- Entity: ${stateChange.entityId}, Old state: ${stateChange.oldState} → New state: ${stateChange.newState}`;

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
      "## End-user",
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
