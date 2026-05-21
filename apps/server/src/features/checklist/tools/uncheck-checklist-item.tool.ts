import { z } from "zod";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ChecklistItem } from "@home-ai/shared/domain/checklist/checklist-item";
import { ToolContext } from "src/tools/types/tool-context";
import { ToolParameterUtils } from "src/tools/utils/tool-parameter-utils";
import { ChecklistManagerService } from "src/features/checklist/services/checklist-manager.service";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";

const UncheckChecklistItemToolSchema = z.object({
  checklistId: z
    .preprocess(ToolParameterUtils.stripQuotes, z.string().uuid())
    .describe("The unique ID of the checklist containing the item"),
  checklistItemId: z
    .preprocess(ToolParameterUtils.stripQuotes, z.string().uuid())
    .describe(
      "The unique ID of the specific item to uncheck. Note: If the ID is unknown, you must call 'get-checklist' first.",
    ),
});

export interface UncheckChecklistItemResult {
  success: boolean;
  item: ChecklistItem;
  message: string;
}

@Tool()
@Injectable()
export class UncheckChecklistItemTool extends ToolHandler<
  typeof UncheckChecklistItemToolSchema,
  UncheckChecklistItemResult
> {
  readonly name = "uncheck-checklist-item";
  readonly description =
    "Marks a completed checklist item as incomplete. This clears the completion timestamp and user data.";

  readonly parameters = UncheckChecklistItemToolSchema;

  constructor(private readonly checklistManager: ChecklistManagerService) {
    super();
  }

  async execute(
    params: z.infer<typeof this.parameters>,
    context: ToolContext,
  ): Promise<UncheckChecklistItemResult> {
    const item = await this.checklistManager.uncheckItem(
      params.checklistId,
      params.checklistItemId,
      context.authUser,
    );

    return {
      success: true,
      item,
      message: `🔄 Task "${item.title}" has been marked as incomplete.`,
    };
  }
}
