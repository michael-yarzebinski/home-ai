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

const AddChecklistItemToolSchema = z.object({
  checklistId: z
    .preprocess(ToolParameterUtils.stripQuotes, z.string().uuid())
    .describe("The unique ID of the checklist to add the item to"),
  title: z
    .preprocess(ToolParameterUtils.stripQuotes, z.string().min(1))
    .describe("The task title or description"),
  description: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : ToolParameterUtils.stripQuotes(v),
      z.string().optional(),
    )
    .describe("Optional detailed notes about the task"),
  priority: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : String(ToolParameterUtils.stripQuotes(v)).toLowerCase(),
      z.nativeEnum(ChecklistItemPriority),
    )
    .default(ChecklistItemPriority.LOW)
    .describe("Task priority: low, medium, high, or critical"),
  assigneeId: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : ToolParameterUtils.stripQuotes(v),
      z.string().optional(),
    )
    .describe(
      "Optional user ID to assign this task to. Defaults to the current user if not provided.",
    ),
  tags: z
    .preprocess(ToolParameterUtils.toStringArray, z.array(z.string()))
    .default([])
    .describe("Tags used for item lookup and generation"),
});

export interface AddChecklistItemResult {
  success: boolean;
  item: ChecklistItem;
  message: string;
}

@Tool()
@Injectable()
export class AddChecklistItemTool extends ToolHandler<
  typeof AddChecklistItemToolSchema,
  AddChecklistItemResult
> {
  readonly name = "add-checklist-item";
  readonly description = "Adds a new task (item) to a specific checklist.";

  readonly parameters = AddChecklistItemToolSchema;

  constructor(
    private readonly checklistStore: ChecklistStore,
    private readonly checklistItemStore: ChecklistItemStore,
  ) {
    super();
  }

  async execute(
    params: z.infer<typeof this.parameters>,
    context: ToolContext,
  ): Promise<AddChecklistItemResult> {
    const checklist = await this.checklistStore.getById(
      params.checklistId,
      false,
      context.user,
    );
    if (!checklist) {
      throw new NotFoundException("Checklist not found");
    }

    const item = await this.checklistItemStore.create(
      {
        checklistId: params.checklistId,
        title: params.title,
        description: params.description,
        priority: params.priority,
        assigneeId: params.assigneeId ?? context.user.id,
        tags: params.tags,
        status: ChecklistItemStatus.PENDING,
        metadata: {},
      },
      context.user,
    );

    return {
      success: true,
      item,
      message: `✅ Task "${params.title}" has been added to the checklist.`,
    };
  }
}
