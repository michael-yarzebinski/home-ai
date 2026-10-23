import { z } from "zod";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ChecklistStore } from "src/features/checklist/stores/checklist.store";
import { Checklist } from "@home-ai/shared/domain/checklist/checklist";
import { ToolContext } from "src/tools/types/tool-context";
import { addPermissionFlags } from "src/common/utils/permissions";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";
import { fuzzyFind } from "src/tools/utils/fuzzy-find.utils";

const FindChecklistsToolSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      'Natural-language or partial checklist name (e.g. "morning routine"). ' +
        "Matched against checklist name; typos are OK.",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(25)
    .optional()
    .describe("Max matches to return (default 10)."),
});

export interface FindChecklistsResult {
  success: boolean;
  total: number;
  query: string;
  checklists: Array<
    Checklist & {
      canRead?: boolean;
      canWrite?: boolean;
      score: number;
    }
  >;
}

@Tool()
@Injectable()
export class FindChecklistsTool extends ToolHandler<
  typeof FindChecklistsToolSchema,
  FindChecklistsResult
> {
  readonly name = "find-checklists";
  readonly description =
    "Fuzzy-search checklists registered in Home AI by name. " +
    "Prefer this over list-checklists when resolving a user phrase to a checklist. " +
    "If 0 or many matches, ask for clarification or call list-checklists. " +
    "Never invent checklist ids — only use ids returned here or from list-checklists.";

  readonly parameters = FindChecklistsToolSchema;

  constructor(private readonly checklistStore: ChecklistStore) {
    super();
  }

  async execute(
    params: z.infer<typeof FindChecklistsToolSchema>,
    context: ToolContext,
  ): Promise<FindChecklistsResult> {
    const checklists = await this.checklistStore.getAll(
      context.authUser,
      false,
    );
    const available = addPermissionFlags(checklists, context.authUser.role);
    const matches = fuzzyFind(available, params.query, (c) => [c.name], {
      limit: params.limit,
    });

    return {
      success: true,
      total: matches.length,
      query: params.query,
      checklists: matches,
    };
  }
}
