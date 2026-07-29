import { z } from "zod";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ChecklistItem } from "@home-ai/shared/domain/checklist/checklist-item";
import { ToolContext } from "src/tools/types/tool-context";
import { ToolParameterUtils } from "src/tools/utils/tool-parameter-utils";
import { ChecklistManagerService } from "src/features/checklist/services/checklist-manager.service";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";

const CheckChecklistItemToolSchema = z.object({
  checklistId: z
    .preprocess(ToolParameterUtils.stripQuotes, z.string().uuid())
    .describe("The unique ID of the checklist containing the item"),
  checklistItemId: z
    .preprocess(ToolParameterUtils.stripQuotes, z.string().uuid())
    .describe(
      "The unique ID of the specific item to complete. Note: If the ID is unknown, you must call 'get-checklist' first to find it.",
    ),
});

export interface CheckChecklistItemResult {
  success: boolean;
  item: ChecklistItem;
  message: string;
}

@Tool()
@Injectable()
export class CheckChecklistItemTool extends ToolHandler<
  typeof CheckChecklistItemToolSchema,
  CheckChecklistItemResult
> {
  readonly name = "check-checklist-item";
  readonly description =
    "Marks a checklist item as completed. This will automatically update audit fields and unblock any dependent tasks.";

  readonly parameters = CheckChecklistItemToolSchema;

  constructor(private readonly checklistManager: ChecklistManagerService) {
    super();
  }

  async execute(
    params: z.infer<typeof this.parameters>,
    context: ToolContext,
  ): Promise<CheckChecklistItemResult> {
    const item = await this.checklistManager.checkItem(
      params.checklistId,
      params.checklistItemId,
      context.authUser,
    );

    return {
      success: true,
      item,
      message: `✅ Task "${item.title}" marked as complete. Any dependent tasks have been evaluated for unblocking.`,
    };
  }
}
