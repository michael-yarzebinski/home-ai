import { z } from "zod";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ChecklistStore } from "src/features/checklist/stores/checklist.store";
import { Checklist } from "@home-ai/shared/domain/checklist/checklist";
import { ToolContext } from "src/tools/types/tool-context";
import { addPermissionFlags } from "src/common/utils/permissions";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";

const ListChecklistsToolSchema = z.object();

export interface ListChecklistsResult {
  success: boolean;
  total: number;
  checklists: Checklist[];
}

@Tool()
@Injectable()
export class ListChecklistsTool extends ToolHandler<
  typeof ListChecklistsToolSchema,
  ListChecklistsResult
> {
  readonly name = "list-checklists";
  readonly description = "Retrieves a list of available checklists.";

  readonly parameters = ListChecklistsToolSchema;

  constructor(private readonly checklistStore: ChecklistStore) {
    super();
  }

  async execute(
    _params: z.infer<typeof this.parameters>,
    context: ToolContext,
  ): Promise<ListChecklistsResult> {
    const checklists = await this.checklistStore.getAll(
      context.authUser,
      false,
    );
    const availableChecklists = addPermissionFlags(
      checklists,
      context.authUser.role,
    );

    return {
      success: true,
      total: availableChecklists.length,
      checklists: availableChecklists,
    };
  }
}
