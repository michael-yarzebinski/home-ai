import { z } from "zod";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ToolContext } from "src/tools/types/tool-context";
import { RecurringChecklistItemStore } from "src/features/checklist/stores/recurring-checklist-item.store";

const GetRecurringItemTagsToolSchema = z.object({});

export interface GetRecurringItemTagsResult {
  success: boolean;
  total: number;
  tags: string[];
}

@Tool()
@Injectable()
export class GetRecurringItemTagsTool extends ToolHandler<
  typeof GetRecurringItemTagsToolSchema,
  GetRecurringItemTagsResult
> {
  readonly name = "get-recurring-item-tags";
  readonly description =
    "Returns the list of recurring checklist item tags so the AI can choose valid tag names.";
  readonly parameters = GetRecurringItemTagsToolSchema;

  constructor(
    private readonly recurringChecklistItemStore: RecurringChecklistItemStore,
  ) {
    super();
  }

  async execute(
    _params: z.infer<typeof this.parameters>,
    context: ToolContext,
  ): Promise<GetRecurringItemTagsResult> {
    const tags = await this.recurringChecklistItemStore.getTags(
      context.authUser,
    );
    const sortedTags = [...tags].sort((a, b) => a.localeCompare(b));

    return {
      success: true,
      total: sortedTags.length,
      tags: sortedTags,
    };
  }
}
