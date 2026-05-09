import { z } from "zod";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ToolContext } from "src/tools/types/tool-context";
import { ToolParameterUtils } from "src/tools/utils/tool-parameter-utils";
import { ChecklistManagerService } from "src/features/checklist/services/checklist-manager.service";
import { RecurringChecklistItemStore } from "src/features/checklist/stores/recurring-checklist-item.store";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";

const GenerateChecklistItemsFromTagsToolSchema = z.object({
  checklistId: z
    .preprocess(ToolParameterUtils.stripQuotes, z.string().uuid())
    .describe(
      "The unique ID of the active checklist where items should be added",
    ),
  tags: z
    .preprocess(
      (v) => (typeof v === "string" ? [ToolParameterUtils.stripQuotes(v)] : v),
      z.array(z.string()),
    )
    .describe(
      "The tags used to identify recurring blueprints (e.g., ['morning-routine', 'cleaning'])",
    ),
});

export interface GenerateChecklistItemsFromTagsResult {
  success: boolean;
  count: number;
  message: string;
}

@Tool()
@Injectable()
export class GenerateChecklistItemsFromTagsTool extends ToolHandler<
  typeof GenerateChecklistItemsFromTagsToolSchema,
  GenerateChecklistItemsFromTagsResult
> {
  readonly name = "generate-checklist-items-from-tags";
  readonly description =
    "Finds recurring task blueprints by tags and generates active checklist items, automatically resolving all recursive dependencies.";

  readonly parameters = GenerateChecklistItemsFromTagsToolSchema;

  constructor(
    private readonly checklistManager: ChecklistManagerService,
    private readonly recurringChecklistItemStore: RecurringChecklistItemStore,
  ) {
    super();
  }

  async execute(
    params: z.infer<typeof this.parameters>,
    context: ToolContext,
  ): Promise<GenerateChecklistItemsFromTagsResult> {
    const recurringItems = await this.recurringChecklistItemStore.getByTags(
      params.tags,
      context.requestUser,
    );

    const items =
      await this.checklistManager.generateChecklistItemsFromRecurringItems(
        recurringItems,
        context.requestUser,
      );

    const tagList = params.tags.join(", ");
    return {
      success: true,
      count: items.length,
      message: `✅ Successfully generated ${items.length} items from templates matching tags: [${tagList}].`,
    };
  }
}
