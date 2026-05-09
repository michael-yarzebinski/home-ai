import { z } from "zod";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ChecklistItemStore } from "src/features/checklist/stores/checklist-item.store";
import { ChecklistItem } from "@home-ai/shared/domain/checklist/checklist-item";
import { ToolContext } from "src/tools/types/tool-context";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";

const GetUserAssignedChecklistItemsToolSchema = z.object();

export interface GetUserAssignedChecklistItemsResult {
  success: boolean;
  total: number;
  items: ChecklistItem[];
}

@Tool()
@Injectable()
export class GetUserAssignedChecklistItemsTool extends ToolHandler<
  typeof GetUserAssignedChecklistItemsToolSchema,
  GetUserAssignedChecklistItemsResult
> {
  readonly name = "get-user-assigned-checklist-items";
  readonly description =
    "Retrieves all checklist items currently assigned to the authenticated user.";

  readonly parameters = GetUserAssignedChecklistItemsToolSchema;

  constructor(private readonly checklistItemStore: ChecklistItemStore) {
    super();
  }

  async execute(
    _params: z.infer<typeof this.parameters>,
    context: ToolContext,
  ): Promise<GetUserAssignedChecklistItemsResult> {
    const result = await this.checklistItemStore.getByAssigneeId(
      context.requestUser.id,
      context.requestUser,
      false,
    );

    return {
      success: true,
      total: result.length,
      items: result,
    };
  }
}
