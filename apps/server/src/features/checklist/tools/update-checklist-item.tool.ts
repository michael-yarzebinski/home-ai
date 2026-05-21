import { z } from "zod";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ChecklistItemStore } from "src/features/checklist/stores/checklist-item.store";
import {
  ChecklistItem,
  ChecklistItemPriority,
  ChecklistItemStatus,
} from "@home-ai/shared/domain/checklist/checklist-item";
import { ToolContext } from "src/tools/types/tool-context";
import { ToolParameterUtils } from "src/tools/utils/tool-parameter-utils";
import { Injectable, NotFoundException } from "@nestjs/common";
import { ChecklistStore } from "src/features/checklist/stores/checklist.store";
import { Tool } from "src/tools/decorators/tool.decorator";

const UpdateChecklistItemToolSchema = z.object({
  id: z
    .preprocess(ToolParameterUtils.stripQuotes, z.string().uuid())
    .describe("The unique ID of the checklist item to update"),
  title: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : ToolParameterUtils.stripQuotes(v),
      z.string().optional(),
    )
    .describe("The updated task title"),
  description: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : ToolParameterUtils.stripQuotes(v),
      z.string().optional(),
    )
    .describe("Updated detailed notes"),
  priority: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : String(ToolParameterUtils.stripQuotes(v)).toLowerCase(),
      z.enum(ChecklistItemPriority).optional(),
    )
    .describe("Optional updated priority: low, medium, high, or critical"),
  status: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : String(ToolParameterUtils.stripQuotes(v)).toLowerCase(),
      z.enum(ChecklistItemStatus).optional(),
    )
    .describe("Optional updated status: pending, blocked, or completed"),
  assigneeId: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : ToolParameterUtils.stripQuotes(v),
      z.string().optional(),
    )
    .describe("The ID of the user assigned to this task"),
  dueDate: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : ToolParameterUtils.stripQuotes(v),
      z.coerce.date().optional(),
    )
    .describe("The updated due date for the task"),
  tags: z
    .preprocess(
      ToolParameterUtils.toStringArray,
      z.array(z.string()).optional(),
    )
    .describe("Optional replacement tags list"),
});

export interface UpdateChecklistItemResult {
  success: boolean;
  item: ChecklistItem;
  message: string;
}

@Tool()
@Injectable()
export class UpdateChecklistItemTool extends ToolHandler<
  typeof UpdateChecklistItemToolSchema,
  UpdateChecklistItemResult
> {
  readonly name = "update-checklist-item";
  readonly description =
    "Updates an existing checklist item's details, such as title, priority, assignee, or due date.";

  readonly parameters = UpdateChecklistItemToolSchema;

  constructor(
    private readonly checklistItemStore: ChecklistItemStore,
    private readonly checklistStore: ChecklistStore,
  ) {
    super();
  }

  async execute(
    params: z.infer<typeof this.parameters>,
    context: ToolContext,
  ): Promise<UpdateChecklistItemResult> {
    const { id, ...updates } = params;

    const existingItem = await this.checklistItemStore.getById(
      id,
      context.authUser,
    );
    if (!existingItem) {
      throw new NotFoundException("Checklist item not found");
    }
    const checklist = await this.checklistStore.getById(
      existingItem.checklistId,
      context.authUser,
    );
    if (!checklist) {
      throw new NotFoundException("Checklist not found");
    }

    const item = await this.checklistItemStore.update(
      id,
      updates,
      context.authUser,
    );

    return {
      success: true,
      item,
      message: `✅ Checklist item "${item.title}" has been updated successfully.`,
    };
  }
}
