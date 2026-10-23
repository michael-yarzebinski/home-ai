import { z } from "zod";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";
import { AutomationRuleStore } from "src/core/stores/automation-rule/automation-rule.store";
import { ToolParameterUtils } from "src/tools/utils/tool-parameter-utils";
import { ToolContext } from "../../types/tool-context";

const toRecord = (value: unknown): unknown => {
  if (ToolParameterUtils.isEmptyOptionalInput(value)) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
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

const UpdateAutomationRuleSchema = z.object({
  id: z.preprocess(ToolParameterUtils.stripQuotes, z.string().uuid()),
  active: z.preprocess(
    ToolParameterUtils.toBooleanValue,
    z.boolean().optional(),
  ),
  disabled: z
    .preprocess(ToolParameterUtils.toBooleanValue, z.boolean().optional())
    .describe(
      "When true, the rule stays saved and does not run. Set false to turn it back on.",
    ),
  name: z.preprocess(
    (v) =>
      ToolParameterUtils.isEmptyOptionalInput(v)
        ? undefined
        : ToolParameterUtils.stripQuotes(v),
    z.string().optional(),
  ),
  triggerParams: z
    .preprocess(toRecord, z.record(z.string(), z.any()).optional())
    .describe("Update specific trigger values like cron strings or thresholds"),
  actions: z.preprocess(
    ToolParameterUtils.toUnknownArray,
    z.array(z.any()).optional(),
  ),
});

@Tool()
@Injectable()
export class UpdateAutomationRuleTool extends ToolHandler<
  typeof UpdateAutomationRuleSchema
> {
  readonly name = "update-automation-rule";
  readonly description =
    "Modify an existing automation rule (schedule, actions, or the disabled flag).";
  readonly parameters = UpdateAutomationRuleSchema;

  constructor(private readonly automationStore: AutomationRuleStore) {
    super();
  }

  async execute(
    params: z.infer<typeof UpdateAutomationRuleSchema>,
    context: ToolContext,
  ) {
    const { id, ...updates } = params;

    // Logic to merge triggerParams if they exist
    const existing = await this.automationStore.getById(
      id,
      context.authUser,
      false,
    );
    if (!existing) return { success: false, message: "Rule not found" };

    const finalUpdate: any = { ...updates };
    if (params.triggerParams) {
      finalUpdate.trigger = { ...existing.trigger, ...params.triggerParams };
      delete finalUpdate.triggerParams;
    }

    await this.automationStore.update(id, finalUpdate, context.authUser);
    return { success: true, message: `✅ Rule ${id} updated successfully.` };
  }
}
