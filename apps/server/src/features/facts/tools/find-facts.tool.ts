import { z } from "zod";
import { FactsStore } from "../stores/facts.store";
import type { Fact } from "@home-ai/shared/domain/fact/fact";
import { addPermissionFlags } from "src/common/utils/permissions";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ToolContext } from "src/tools/types/tool-context";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";
import { fuzzyFind } from "src/tools/utils/fuzzy-find.utils";

const FindFactsToolSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      'Natural-language or partial fact key (e.g. "dog diet"). ' +
        "Matched against fact key; typos are OK.",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(25)
    .optional()
    .describe("Max matches to return (default 10)."),
});

export interface FindFactsResult {
  facts: Array<
    Fact & {
      canRead: boolean;
      canWrite: boolean;
      score: number;
    }
  >;
  total: number;
  query: string;
}

@Tool()
@Injectable()
export class FindFactsTool extends ToolHandler<
  typeof FindFactsToolSchema,
  FindFactsResult
> {
  readonly name = "find-facts";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "Fuzzy-search facts registered in Home AI by key. " +
    "Prefer this over list-facts when resolving a user phrase to a fact key. " +
    "If 0 or many matches, ask for clarification or call list-facts. " +
    "Never invent fact keys — only use keys returned here or from list-facts.";

  readonly parameters = FindFactsToolSchema;

  constructor(private readonly factsStore: FactsStore) {
    super();
  }

  async execute(
    params: z.infer<typeof FindFactsToolSchema>,
    context: ToolContext,
  ): Promise<FindFactsResult> {
    const facts = await this.factsStore.getAll(context.authUser);
    const available = addPermissionFlags(facts, context.authUser.role);
    const matches = fuzzyFind(available, params.query, (f) => [f.key], {
      limit: params.limit,
    });

    return {
      facts: matches,
      total: matches.length,
      query: params.query,
    };
  }
}
