// src/tools/default/list-facts.tool.ts
import { z } from 'zod';
import { FactsStore } from '../stores/facts.store';
import type { Fact } from '@home-ai/shared/domain/fact/fact';
import { addPermissionFlags } from 'src/common/utils/permissions';
import { ToolHandler } from 'src/tools/abstract/tool-handler';
import { ToolContext } from 'src/tools/types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

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
export class ListFactsTool extends ToolHandler<typeof ListFactsToolSchema, ListFactsResult> {
  readonly name = 'list-facts';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'List all facts the current user has permission to see. ' +
    'This is the recommended first step when the user asks about any stored fact. ' +
    'Always call this tool first unless you already know the exact fact key from previous context.';

  readonly parameters = ListFactsToolSchema;

  constructor(private readonly factsStore: FactsStore) {
    super();
  }

  async execute(
    _params: z.infer<typeof ListFactsToolSchema>,
    context: ToolContext,
  ): Promise<ListFactsResult> {
    let facts = await this.factsStore.getAll();

    const availableFacts = addPermissionFlags(facts, context.userRole);

    return {
      facts: availableFacts,
      total: availableFacts.length,
    };
  }
}
