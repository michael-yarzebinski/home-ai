// src/tools/default/update-fact.tool.ts
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ToolContext } from "src/tools/types/tool-context";
import { z } from "zod";
import { FactsStore } from "../stores/facts.store";
import { Role } from "@home-ai/shared/domain/role/role";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";
import { ToolParameterUtils } from "src/tools/utils/tool-parameter-utils";

const UpdateFactToolSchema = z.object({
  key: z
    .preprocess(ToolParameterUtils.toStringValue, z.string().min(1))
    .describe("Exact key from list-facts (facts registered in Home AI)."),

  value: z
    .preprocess(ToolParameterUtils.toStringValue, z.string())
    .optional()
    .describe("New value/content for the fact"),

  tags: z
    .preprocess(ToolParameterUtils.toStringArray, z.array(z.string()))
    .optional()
    .describe("New list of tags (replaces existing tags)"),

  readRoles: z
    .preprocess(ToolParameterUtils.toStringArray, z.array(z.string()))
    .optional()
    .describe("New read roles (replaces existing roles)"),

  writeRoles: z
    .preprocess(ToolParameterUtils.toStringArray, z.array(z.string()))
    .optional()
    .describe("New write roles (replaces existing roles)"),
});

export interface UpdateFactResult {
  success: boolean;
  message: string;
  key: string;
}

@Tool()
@Injectable()
export class UpdateFactTool extends ToolHandler<
  typeof UpdateFactToolSchema,
  UpdateFactResult
> {
  readonly name = "update-fact";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "Update a fact registered in Home AI (value, tags, or roles). Call list-facts first if the key is unknown. At least one mutable field must be provided.";

  readonly parameters = UpdateFactToolSchema;

  constructor(private readonly factsStore: FactsStore) {
    super();
  }

  async execute(
    params: z.infer<typeof UpdateFactToolSchema>,
    context: ToolContext,
  ): Promise<UpdateFactResult> {
    const fact = await this.factsStore.getByKey(params.key, context.authUser);

    if (!fact) {
      return {
        success: false,
        message: `Fact with key "${params.key}" not found.`,
        key: params.key,
      };
    }

    const updatedFact = await this.factsStore.update(
      fact.id,
      {
        value: params.value,
        tags: params.tags,
        readRoles: params.readRoles ? (params.readRoles as Role[]) : undefined,
        writeRoles: params.writeRoles
          ? (params.writeRoles as Role[])
          : undefined,
      },
      context.authUser,
    );

    return {
      success: true,
      message: `✅ Fact "${params.key}" has been updated successfully.`,
      key: updatedFact.key,
    };
  }
}
