// src/tools/default/update-fact.tool.ts
import { ToolHandler } from 'src/tools/abstract/tool-handler';
import { ToolContext } from 'src/tools/types/tool-context';
import { z } from 'zod';
import { FactsStore } from '../stores/facts.store';
import { Role } from '@home-ai/shared/domain/role/role';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

const UpdateFactToolSchema = z.object({
  key: z.string().min(1).describe('The exact key of the fact to update'),

  value: z.string().optional().describe('New value/content for the fact'),

  tags: z.array(z.string()).optional().describe('New list of tags (replaces existing tags)'),

  readRoles: z.array(z.string()).optional().describe('New read roles (replaces existing roles)'),

  writeRoles: z.array(z.string()).optional().describe('New write roles (replaces existing roles)'),
});

export interface UpdateFactResult {
  success: boolean;
  message: string;
  key: string;
}

@Tool()
@Injectable()
export class UpdateFactTool extends ToolHandler<typeof UpdateFactToolSchema, UpdateFactResult> {
  readonly name = 'update-fact';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'Update an existing fact in the knowledge base. ' +
    'You can update the value, tags, or roles. At least one field must be provided.';

  readonly parameters = UpdateFactToolSchema;

  constructor(private readonly factsStore: FactsStore) {
    super();
  }

  async execute(
    params: z.infer<typeof UpdateFactToolSchema>,
    context: ToolContext,
  ): Promise<UpdateFactResult> {
    const fact = await this.factsStore.getByKey(params.key);

    if (!fact) {
      return {
        success: false,
        message: `Fact with key "${params.key}" not found.`,
        key: params.key,
      };
    }

    const updatedFact = await this.factsStore.update(fact.id, {
      value: params.value,
      tags: params.tags,
      readRoles: params.readRoles ? (params.readRoles as Role[]) : undefined,
      writeRoles: params.writeRoles ? (params.writeRoles as Role[]) : undefined,
    });

    return {
      success: true,
      message: `✅ Fact "${params.key}" has been updated successfully.`,
      key: updatedFact.key,
    };
  }
}
