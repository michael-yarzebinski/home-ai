import z from "zod";
import { RecurringChecklistItemStore } from "src/features/checklist/stores/recurring-checklist-item.store";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ToolContext } from "src/tools/types/tool-context";
import { ToolParameterUtils } from "src/tools/utils/tool-parameter-utils";
import { ChecklistItemPriority } from "@home-ai/shared/domain/checklist/checklist-item";
import { RecurringChecklistItem } from "@home-ai/shared/domain/checklist/recurring-checklist-item";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";
import { ChecklistStore } from "src/features/checklist/stores/checklist.store";

const UpdateRecurringItemToolSchema = z.object({
  id: z.preprocess(ToolParameterUtils.stripQuotes, z.string().uuid()),
  title: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : ToolParameterUtils.stripQuotes(v),
      z.string().optional(),
    )
    .describe("Optional new title for this recurring template"),
  description: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : ToolParameterUtils.stripQuotes(v),
      z.string().optional(),
    )
    .describe("Optional new description"),
  priority: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : ToolParameterUtils.stripQuotes(v),
      z.enum(ChecklistItemPriority).optional(),
    )
    .describe("Optional priority override"),
  tags: z
    .preprocess(
      ToolParameterUtils.toStringArray,
      z.array(z.string()).optional(),
    )
    .describe("Optional replacement tags list"),
  triggerConfig: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : ToolParameterUtils.toObject(v, {}),
      z
        .object({
          cron: z.preprocess(
            (value) =>
              ToolParameterUtils.isEmptyOptionalInput(value)
                ? undefined
                : ToolParameterUtils.stripQuotes(value),
            z.string().optional(),
          ),
          eventTag: z.preprocess(
            (value) =>
              ToolParameterUtils.isEmptyOptionalInput(value)
                ? undefined
                : ToolParameterUtils.stripQuotes(value),
            z.string().optional(),
          ),
          dueInDays: z.preprocess(
            ToolParameterUtils.toNumberValue,
            z.number().optional(),
          ),
        })
        .optional(),
    )
    .describe("Optional trigger config patch ({ cron, eventTag, dueInDays })"),
  dependsOnRecurringIds: z
    .preprocess(
      ToolParameterUtils.toStringArray,
      z.array(z.string()).optional(),
    )
    .describe("Optional replacement list of recurring-item dependencies"),
  active: z
    .preprocess(ToolParameterUtils.toBooleanValue, z.boolean().optional())
    .describe("Optional active status"),
});

export interface UpdateRecurringItemResult {
  success: boolean;
  item: RecurringChecklistItem;
  message: string;
}

@Tool()
@Injectable()
export class UpdateRecurringItemTool extends ToolHandler<
  typeof UpdateRecurringItemToolSchema,
  UpdateRecurringItemResult
> {
  readonly name = "update-recurring-item";
  readonly description =
    "Updates a recurring task template's configuration, tags, or active status.";
  readonly parameters = UpdateRecurringItemToolSchema;

  constructor(
    private readonly recurringStore: RecurringChecklistItemStore,
    private readonly checklistStore: ChecklistStore,
  ) {
    super();
  }

  async execute(
    params: z.infer<typeof this.parameters>,
    context: ToolContext,
  ): Promise<UpdateRecurringItemResult> {
    const { id, ...updates } = params;
    const existingRecurringItem = await this.recurringStore.getById(
      id,
      context.requestUser,
    );
    const checklist = await this.checklistStore.getById(
      existingRecurringItem?.checklistId ?? "",
      context.requestUser,
    );
    if (!checklist) {
      throw new NotFoundException("Checklist not found");
    }

    const item = await this.recurringStore.update(
      id,
      updates,
      context.requestUser,
    );
    return {
      success: true,
      item,
      message: `✅ Recurring template "${item.title}" updated.`,
    };
  }
}
