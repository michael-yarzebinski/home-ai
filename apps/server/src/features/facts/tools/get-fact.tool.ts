// src/tools/default/get-fact.tool.ts
import { ToolHandler } from 'src/tools/abstract/tool-handler';
import { ToolContext } from 'src/tools/types/tool-context';
import { z } from 'zod';
import { FactsStore } from '../stores/facts.store';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

const GetFactToolSchema = z.object({
  key: z
    .string()
    .min(1)
    .describe('The exact key of the fact to retrieve (e.g. "Toms birthday", "wifi password", "garage code")'),
});

export interface GetFactResult {
  key: string;
  value: string;
  message: string;
}

@Tool()
@Injectable()
export class GetFactTool extends ToolHandler<typeof GetFactToolSchema, GetFactResult> {
  readonly name = 'get-fact';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'Retrieve a specific fact by its exact key. ' +
    'Only use this tool if you already know the exact key from a previous list-facts call. ' +
    'Do not guess the key. If unsure, call list-facts first.';

  readonly parameters = GetFactToolSchema;

  constructor(private readonly factsStore: FactsStore) {
    super();
  }

  async execute(
    params: z.infer<typeof GetFactToolSchema>,
    context: ToolContext,
  ): Promise<GetFactResult> {
    const fact = await this.factsStore.getByKey(params.key);

    if (!fact) {
      return {
        key: params.key,
        value: '',
        message: `Fact with key "${params.key}" not found. Try calling list-facts first.`,
      };
    }

    return {
      key: fact.key,
      value: fact.value,
      message: `Fact "${fact.key}" retrieved.`,
    };
  }
}
