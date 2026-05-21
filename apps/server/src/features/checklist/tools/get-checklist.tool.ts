import { z } from "zod";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { Checklist } from "@home-ai/shared/domain/checklist/checklist";
import { ChecklistItem } from "@home-ai/shared/domain/checklist/checklist-item";
import { RecurringChecklistItem } from "@home-ai/shared/domain/checklist/recurring-checklist-item";
import { ToolContext } from "src/tools/types/tool-context";
import { ToolParameterUtils } from "src/tools/utils/tool-parameter-utils";
import { Injectable, NotFoundException } from "@nestjs/common";
import { ChecklistManagerService } from "src/features/checklist/services/checklist-manager.service";
import { Tool } from "src/tools/decorators/tool.decorator";

const GetChecklistToolSchema = z.object({
  id: z
    .preprocess(ToolParameterUtils.stripQuotes, z.string().uuid())
    .describe("The unique ID of the checklist to retrieve"),
});

export interface GetChecklistResult {
  success: boolean;
  checklist: Checklist;
  checklistItems: ChecklistItem[];
  recurringChecklistItems: RecurringChecklistItem[];
}

@Tool()
@Injectable()
export class GetChecklistTool extends ToolHandler<
  typeof GetChecklistToolSchema,
  GetChecklistResult
> {
  readonly name = "get-checklist";
  readonly description =
    "Retrieves the full details of a checklist, including all active tasks and recurring task templates.";

  readonly parameters = GetChecklistToolSchema;

  constructor(
    private readonly checklistManagerService: ChecklistManagerService,
  ) {
    super();
  }

  async execute(
    params: z.infer<typeof this.parameters>,
    context: ToolContext,
  ): Promise<GetChecklistResult> {
    const checklist = await this.checklistManagerService
      .checklistReader()
      .getById(params.id, context.authUser);

    if (!checklist) {
      throw new NotFoundException(`Checklist with ID ${params.id} not found.`);
    }

    const checklistItems = await this.checklistManagerService
      .checklistItemReader()
      .getByChecklistId(params.id, context.authUser);
    const recurringChecklistItems = await this.checklistManagerService
      .recurringChecklistItemReader()
      .getByChecklistId(params.id, context.authUser);

    return {
      success: true,
      checklist,
      checklistItems,
      recurringChecklistItems,
    };
  }
}
