import { Injectable } from "@nestjs/common";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { Tool } from "src/tools/decorators/tool.decorator";
import { ToolContext } from "src/tools/types/tool-context";
import { AutomationRuleStore } from "src/core/stores/automation-rule/automation-rule.store";
import { ToolParameterUtils } from "src/tools/utils/tool-parameter-utils";
import { z } from "zod";
import {
  TriggerType,
  ActionType,
  TriggerConfig,
} from "@home-ai/shared/domain/automation-rule/automation-rule";

const toRecord = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
        return parsed;
    } catch {
      return value;
    }
  }
  return value;
};

const ActionSchema = z.object({
  type: z.nativeEnum(ActionType),
  instruction: z
    .preprocess(ToolParameterUtils.stripQuotes, z.string())
    .describe("Natural language goal for the action"),
  metadata: z.preprocess(toRecord, z.record(z.string(), z.any()).optional()),
});

const AddAutomationRuleSchema = z.object({
  name: z
    .preprocess(ToolParameterUtils.stripQuotes, z.string())
    .describe("Short descriptive name for the rule"),
  description: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : ToolParameterUtils.stripQuotes(v),
      z.string().optional(),
    )
    .describe("Detailed explanation of what the rule does"),
  triggerType: z
    .preprocess((v) => {
      const s = ToolParameterUtils.stripQuotes(v);
      return typeof s === "string" ? s.toUpperCase() : s;
    }, z.nativeEnum(TriggerType))
    .describe("Trigger type: DEVICE, RAW_ENTITY, TIME, SYSTEM, WEBHOOK"),
  triggerParams: z
    .preprocess(toRecord, z.record(z.string(), z.any()))
    .describe(
      "Trigger parameters by type. DEVICE: {deviceId, intent}. RAW_ENTITY: {entityId, intent}. TIME: {cron, timezone}. SYSTEM: {eventName, intent?}. WEBHOOK: {slug, secret?}.",
    ),
  actions: z
    .preprocess(ToolParameterUtils.toUnknownArray, z.array(ActionSchema).min(1))
    .describe("List of actions to perform when triggered"),
  cooldownMinutes: z
    .preprocess(
      ToolParameterUtils.toNumberValue,
      z.number().int().min(0).optional(),
    )
    .default(60)
    .describe(
      "Minimum minutes between rule executions. Optional; defaults to 60.",
    ),
});

@Tool()
@Injectable()
export class AddAutomationRuleTool extends ToolHandler<
  typeof AddAutomationRuleSchema
> {
  readonly name = "add-automation-rule";
  readonly description =
    "Create a new automation rule that reacts to home events or schedules.  You may need to call the list-devices tool to get the deviceId.  You should NOT discover.";
  readonly parameters = AddAutomationRuleSchema;

  constructor(private readonly automationStore: AutomationRuleStore) {
    super();
  }

  async execute(
    params: z.infer<typeof AddAutomationRuleSchema>,
    context: ToolContext,
  ) {
    const trigger = buildTriggerConfig(
      params.triggerType,
      params.triggerParams,
    );

    const rule = await this.automationStore.create({
      userId: context.userId,
      name: params.name,
      description: params.description,
      trigger,
      actions: params.actions.map((a) => ({ ...a, id: crypto.randomUUID() })),
      cooldownMinutes: params.cooldownMinutes,
    });

    return {
      success: true,
      ruleId: rule.id,
      message: `✅ Automation "${params.name}" created.`,
    };
  }
}

const getRequiredString = (
  params: Record<string, any>,
  key: string,
): string => {
  const value = params[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`triggerParams.${key} is required for this triggerType`);
  }
  return value.trim();
};

const buildTriggerConfig = (
  triggerType: TriggerType,
  triggerParams: Record<string, any>,
): TriggerConfig => {
  switch (triggerType) {
    case TriggerType.DEVICE:
      return {
        type: TriggerType.DEVICE,
        deviceId: getRequiredString(triggerParams, "deviceId"),
        intent: getRequiredString(triggerParams, "intent"),
      };
    case TriggerType.TIME:
      return {
        type: TriggerType.TIME,
        cron: getRequiredString(triggerParams, "cron"),
        timezone: getRequiredString(triggerParams, "timezone"),
      };
    case TriggerType.SYSTEM: {
      const intent = triggerParams.intent;
      return {
        type: TriggerType.SYSTEM,
        eventName: getRequiredString(triggerParams, "eventName"),
        ...(typeof intent === "string" && intent.trim().length > 0
          ? { intent: intent.trim() }
          : {}),
      };
    }
    default:
      throw new Error(`Unsupported triggerType: ${triggerType}`);
  }
};
