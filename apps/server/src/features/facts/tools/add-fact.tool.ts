// src/tools/default/add-fact.tool.ts
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ToolContext } from "src/tools/types/tool-context";
import { z } from "zod";
import { FactsStore } from "../stores/facts.store";
import { Role } from "@home-ai/shared/domain/role/role";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";
import { ToolParameterUtils } from "src/tools/utils/tool-parameter-utils";

const AddFactToolSchema = z.object({
  key: z
    .preprocess(ToolParameterUtils.toStringValue, z.string().min(1))
    .describe(
      'A short, unique identifier using snake_case or simple words. No sentences. (e.g. "mikes_favorite_food", "wifi_password")',
    ),

  value: z
    .preprocess(ToolParameterUtils.toStringValue, z.string().min(1))
    .describe(
      'The specific value. Be concise but complete. (e.g. "Pizza", "1234-5678")',
    ),

  tags: z
    .preprocess(ToolParameterUtils.toStringArray, z.array(z.string()))
    .optional()
    .describe('Lowercase category tags. (e.g. ["preferences", "security"])'),

  readRoles: z
    .preprocess(ToolParameterUtils.toStringArray, z.array(z.string()))
    .optional()
    .describe(
      "Roles that can read this fact. If omitted, defaults to current user's role.",
    ),

  writeRoles: z
    .preprocess(ToolParameterUtils.toStringArray, z.array(z.string()))
    .optional()
    .describe(
      "Roles that can update this fact. If omitted, defaults to current user's role.",
    ),
});

export interface AddFactResult {
  success: boolean;
  message: string;
  key: string;
}

@Tool()
@Injectable()
export class AddFactTool extends ToolHandler<
  typeof AddFactToolSchema,
  AddFactResult
> {
  readonly name = "add-fact";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "Add a new fact registered in Home AI. Confirm the key does not already exist via list-facts or get-fact before calling.";

  readonly parameters = AddFactToolSchema;

  constructor(private readonly factsStore: FactsStore) {
    super();
  }

  async execute(
    params: z.infer<typeof AddFactToolSchema>,
    context: ToolContext,
  ): Promise<AddFactResult> {
    const readRoles = params.readRoles?.length
      ? (params.readRoles as Role[])
      : [context.requestUser.role];
    const writeRoles = params.writeRoles?.length
      ? (params.writeRoles as Role[])
      : [context.requestUser.role];

    const fact = await this.factsStore.create(
      {
        key: params.key,
        value: params.value,
        tags: params.tags || [],
        readRoles,
        writeRoles,
      },
      context.requestUser,
    );

    return {
      success: true,
      message: `✅ Fact "${params.key}" has been added successfully.`,
      key: fact.key,
    };
  }
}
