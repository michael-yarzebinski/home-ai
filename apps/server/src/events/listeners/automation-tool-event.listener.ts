import { InjectRedis } from "@nestjs-modules/ioredis";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import {
  AutomationRule,
  TriggerType,
} from "@home-ai/shared/domain/automation-rule/automation-rule";
import { AutomationRuleUtils } from "@home-ai/shared/domain/automation-rule/automation-rule.utils";
import { User } from "@home-ai/shared/domain/user/user";
import Redis from "ioredis";
import { OrchestratorService } from "../../ai/orchestrator/orchestrator.service";
import { LLMModelTypes } from "../../ai/llm/llm.provider.sevice";
import { AppConfigService } from "../../core/services/app-config.service";
import { LogStore } from "../../core/stores/monitoring/log/log.store";
import { AutomationRuleStore } from "../../core/stores/automation-rule/automation-rule.store";
import { UserStore } from "../../core/stores/user/user.store";
import {
  TOOL_EXECUTION_EVENT_CHANNEL,
  ToolExecutionEvent,
} from "../contracts/tool-execution.event";

@Injectable()
export class AutomationToolEventListener
  implements OnModuleInit, OnModuleDestroy
{
  private subscriber?: Redis;
  private readonly automationUserId: string;
  private automationUser: User | null = null;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly automationRuleStore: AutomationRuleStore,
    private readonly logStore: LogStore,
    private readonly userStore: UserStore,
    private readonly orchestratorService: OrchestratorService,
    private readonly appConfigService: AppConfigService,
  ) {
    this.automationUserId =
      this.appConfigService.getFromEnv("AUTOMATION_USER_ID");
  }

  async onModuleInit(): Promise<void> {
    this.automationUser = await this.userStore.getById(this.automationUserId);

    this.subscriber = this.redis.duplicate();

    await this.subscriber.subscribe(TOOL_EXECUTION_EVENT_CHANNEL);
    this.subscriber.on("message", async (_channel, payload) => {
      try {
        const event = JSON.parse(payload) as ToolExecutionEvent;
        await this.processToolExecutionEvent(event);
      } catch (error: any) {
        await this.logStore.create({
          severity: "warn",
          message: `AutomationToolEventListener: ignoring invalid tool execution payload`,
          metadata: { error: error?.message ?? String(error) },
        });
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.quit();
      this.subscriber = undefined;
    }
  }

  private async processToolExecutionEvent(
    event: ToolExecutionEvent,
  ): Promise<void> {
    const filteredRules = await this.loadMatchingToolEventRules(event);

    await this.logStore.create({
      severity: "debug",
      message: `AutomationToolEventListener: tool event consumed (${event.toolName}) with ${filteredRules.length} matching automation rules`,
      metadata: {
        toolName: event.toolName,
        matchedRuleCount: filteredRules.length,
      },
    });

    if (filteredRules.length === 0) {
      return;
    }

    if (!this.automationUser) {
      await this.logStore.create({
        severity: "error",
        message: `AutomationToolEventListener: automation user not loaded (AUTOMATION_USER_ID)`,
        metadata: {
          automationUserId: this.automationUserId,
          toolName: event.toolName,
        },
      });
      return;
    }

    const byRuleOwnerId = new Map<string, AutomationRule[]>();
    for (const rule of filteredRules) {
      const list = byRuleOwnerId.get(rule.userId) ?? [];
      list.push(rule);
      byRuleOwnerId.set(rule.userId, list);
    }

    for (const [ruleOwnerUserId, ownerRules] of byRuleOwnerId.entries()) {
      const ruleOwner = await this.userStore.getById(ruleOwnerUserId);
      if (!ruleOwner?.active) {
        await this.logStore.create({
          severity: "warn",
          message: `AutomationToolEventListener: skip automation — rule owner missing or inactive`,
          metadata: {
            ruleOwnerUserId,
            toolName: event.toolName,
            ruleIds: ownerRules.map((r) => r.id),
          },
        });
        continue;
      }

      await this.runAutomationOrchestrationForRuleOwner(
        event,
        ruleOwnerUserId,
        ownerRules,
      );
    }
  }

  /** Runs orchestration as `this.automationUser`. Caller validates rule owner. */
  private async runAutomationOrchestrationForRuleOwner(
    event: ToolExecutionEvent,
    ruleOwnerUserId: string,
    rules: AutomationRule[],
  ): Promise<void> {
    if (!this.automationUser) {
      return;
    }

    const input = this.buildAutomationOrchestratorPrompt(
      event,
      rules,
      ruleOwnerUserId,
    );

    try {
      await this.orchestratorService.handleEvent(
        this.automationUser,
        input,
        `automation:tool-event:${ruleOwnerUserId}`,
        LLMModelTypes.SOON,
        { suppressToolEvents: true },
      );

      await this.automationRuleStore.updateLastRun(rules.map((r) => r.id));
    } catch (error: any) {
      await this.logStore.create({
        userId: this.automationUser.id,
        severity: "error",
        message: `AutomationToolEventListener: orchestration failed for TOOL_EVENT automation`,
        metadata: {
          error: error?.message ?? String(error),
          toolName: event.toolName,
          ruleOwnerUserId,
          ruleIds: rules.map((r) => r.id),
        },
      });
    }
  }

  /**
   * Prompt mirrors HomeAssistantProcessor: service account runs orchestration; batch is one end-user’s rules.
   */
  private buildAutomationOrchestratorPrompt(
    event: ToolExecutionEvent,
    rules: AutomationRule[],
    ruleOwnerUserId: string,
  ): string {
    const eventPayload = {
      eventType: event.eventType,
      toolName: event.toolName,
      actorUserId: event.userId,
      argsSummary: event.argsSummary,
      resultSummary: event.resultSummary,
      approval: event.approval,
    };

    const rulesPayload = rules.map((r) => ({
      ruleId: r.id,
      ruleName: r.name,
      description: r.description,
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
      "You are the orchestration engine for Home AI. A tool finished executing; matched automation rules must be evaluated and valid actions executed.",
      "",
      "## End-user for this batch",
      `Rule owner user id: ${ruleOwnerUserId}. Notifications, tasks, and other actions must target this user unless tools encode scope explicitly.`,
      "",
      "## Tool execution context",
      JSON.stringify(eventPayload, null, 2),
      "",
      "## Automation rules",
      JSON.stringify(rulesPayload, null, 2),
      "",
      "## Objective",
      "1. Match strictly: only rules listed above apply to this tool event.",
      "2. Execute only actions from those rules; do not invent tools or extra logic.",
      "3. If `conditionOverride` is set, run that action only when the condition holds given context and anything verifiable via read-only tools.",
      "4. Prefer minimal tool calls; read before write where relevant.",
      "5. If nothing applies, call no tools and say so briefly.",
    ].join("\n");
  }

  private async loadMatchingToolEventRules(
    event: ToolExecutionEvent,
  ): Promise<AutomationRule[]> {
    const candidates = await this.automationRuleStore.getByTriggerType(
      TriggerType.TOOL_EVENT,
    );
    return candidates.filter((rule) => {
      if (
        rule.trigger.type !== TriggerType.TOOL_EVENT ||
        !AutomationRuleUtils.isOffCooldown(rule) ||
        rule.userId === event.userId
      ) {
        return false;
      }

      const { toolName } = rule.trigger;
      return !toolName || toolName === event.toolName;
    });
  }
}
