import { z } from "zod";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { RecurringChecklistItemStore } from "src/features/checklist/stores/recurring-checklist-item.store";
import {
  RecurringChecklistItem,
  RecurringChecklistItemTriggerType,
} from "@home-ai/shared/domain/checklist/recurring-checklist-item";
import { ChecklistItemPriority } from "@home-ai/shared/domain/checklist/checklist-item";
import { ToolContext } from "src/tools/types/tool-context";
import { ToolParameterUtils } from "src/tools/utils/tool-parameter-utils";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";

const AddRecurringItemToolSchema = z.object({
  checklistId: z
    .preprocess(ToolParameterUtils.stripQuotes, z.string().uuid())
    .describe("Checklist ID that owns this recurring template"),
  title: z
    .preprocess(ToolParameterUtils.stripQuotes, z.string().min(1))
    .describe("Human-friendly title for the recurring template"),
  description: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : ToolParameterUtils.stripQuotes(v),
      z.string().optional(),
    )
    .describe("Optional description with extra context"),
  priority: z
    .enum(ChecklistItemPriority)
    .default(ChecklistItemPriority.LOW)
    .describe("Template priority; defaults to LOW"),
  tags: z
    .preprocess(ToolParameterUtils.toStringArray, z.array(z.string()))
    .default([])
    .describe("Tags used for template lookup and generation"),
  triggerType: z
    .preprocess(
      (v) => String(ToolParameterUtils.stripQuotes(v)).toUpperCase(),
      z.enum(RecurringChecklistItemTriggerType),
    )
    .describe("Trigger mode: CRON or EVENT"),
  triggerConfig: z
    .preprocess(
      (value) => ToolParameterUtils.toObject(value, {}),
      z.object({
        cron: z.preprocess(
          (v) =>
            ToolParameterUtils.isEmptyOptionalInput(v)
              ? undefined
              : ToolParameterUtils.stripQuotes(v),
          z.string().optional(),
        ),
        eventTag: z.preprocess(
          (v) =>
            ToolParameterUtils.isEmptyOptionalInput(v)
              ? undefined
              : ToolParameterUtils.stripQuotes(v),
          z.string().optional(),
        ),
        dueInDays: z.preprocess(
          ToolParameterUtils.toNumberValue,
          z.number().optional(),
        ),
      }),
    )
    .default({})
    .describe("Trigger configuration object ({ cron, eventTag, dueInDays })"),
  metadata: z
    .preprocess(
      (value) => ToolParameterUtils.toObject(value, {}),
      z.object({
        videoLinks: z.preprocess(
          ToolParameterUtils.toStringArray,
          z.array(z.string()).optional(),
        ),
        requiredItems: z.preprocess(
          ToolParameterUtils.toStringArray,
          z.array(z.string()).optional(),
        ),
      }),
    )
    .default({})
    .describe("Optional metadata such as links or required items"),
  dependsOnRecurringIds: z
    .preprocess(
      ToolParameterUtils.toStringArray,
      z.array(z.string()).optional(),
    )
    .describe("Optional list of recurring-item IDs this template depends on"),
  defaultAssigneeId: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : ToolParameterUtils.stripQuotes(v),
      z.string().optional(),
    )
    .describe("Optional default assignee user ID"),
});

export interface AddRecurringItemResult {
  success: boolean;
  item: RecurringChecklistItem;
  message: string;
}

@Tool()
@Injectable()
export class AddRecurringItemTool extends ToolHandler<
  typeof AddRecurringItemToolSchema,
  AddRecurringItemResult
> {
  readonly name = "add-recurring-item";
  readonly description =
    "Creates a recurring task template (blueprint) that can be automatically or manually added to checklists.";
  readonly parameters = AddRecurringItemToolSchema;

  constructor(private readonly recurringStore: RecurringChecklistItemStore) {
    super();
  }

  async execute(
    params: z.infer<typeof this.parameters>,
    context: ToolContext,
  ): Promise<AddRecurringItemResult> {
    const item = await this.recurringStore.create(params, context.user);
    return {
      success: true,
      item,
      message: `✅ Recurring template "${item.title}" created successfully.`,
    };
  }
}
