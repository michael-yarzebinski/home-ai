// src/tools/default/list-facts.tool.ts
import { z } from "zod";
import { FactsStore } from "../stores/facts.store";
import type { Fact } from "@home-ai/shared/domain/fact/fact";
import { addPermissionFlags } from "src/common/utils/permissions";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ToolContext } from "src/tools/types/tool-context";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";

const ListFactsToolSchema = z.object({});

export interface ListFactsResult {
  facts: Array<
    Fact & {
      canRead: boolean;
      canWrite: boolean;
    }
  >;
  total: number;
}

@Tool()
@Injectable()
export class ListFactsTool extends ToolHandler<
  typeof ListFactsToolSchema,
  ListFactsResult
> {
  readonly name = "list-facts";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "List all facts registered in Home AI; returns only facts this user may see (canRead/canWrite on each row). " +
    "Prefer find-facts when resolving a user phrase to a specific fact key; use this when find returns 0/many or you need the full set. " +
    "Call find-facts or list-facts before get-fact or update-fact unless the exact key is already known.";

  readonly parameters = ListFactsToolSchema;

  constructor(private readonly factsStore: FactsStore) {
    super();
  }

  async execute(
    _params: z.infer<typeof ListFactsToolSchema>,
    context: ToolContext,
  ): Promise<ListFactsResult> {
    let facts = await this.factsStore.getAll(context.authUser);

    const availableFacts = addPermissionFlags(facts, context.authUser.role);

    return {
      facts: availableFacts,
      total: availableFacts.length,
    };
  }
}
