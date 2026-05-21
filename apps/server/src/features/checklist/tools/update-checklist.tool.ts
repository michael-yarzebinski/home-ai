import { z } from "zod";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ChecklistStore } from "src/features/checklist/stores/checklist.store";
import { ToolContext } from "src/tools/types/tool-context";
import { Role } from "@home-ai/shared/domain/role/role";
import { ToolParameterUtils } from "src/tools/utils/tool-parameter-utils";
import { Checklist } from "@home-ai/shared/domain/checklist/checklist";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";

const UpdateChecklistToolSchema = z.object({
  id: z.string().uuid().describe("The ID of the checklist to update"),
  name: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : ToolParameterUtils.stripQuotes(v),
      z.string().optional(),
    )
    .describe("Optional new checklist name"),
  description: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : ToolParameterUtils.stripQuotes(v),
      z.string().optional(),
    )
    .describe("Optional new checklist description"),
  readRoles: z
    .preprocess(ToolParameterUtils.toRoleArray, z.array(z.nativeEnum(Role)))
    .optional()
    .describe("Optional replacement read-role list (supports 'all')"),
  writeRoles: z
    .preprocess(ToolParameterUtils.toRoleArray, z.array(z.nativeEnum(Role)))
    .optional()
    .describe("Optional replacement write-role list (supports 'all')"),
});

export interface UpdateChecklistResult {
  success: boolean;
  message: string;
  checklist: Checklist;
}

@Tool()
@Injectable()
export class UpdateChecklistTool extends ToolHandler<
  typeof UpdateChecklistToolSchema,
  UpdateChecklistResult
> {
  readonly name = "update-checklist";
  readonly description =
    "Updates an existing checklist's name, description, or status.";
  readonly parameters = UpdateChecklistToolSchema;

  constructor(private readonly checklistStore: ChecklistStore) {
    super();
  }

  async execute(
    params: z.infer<typeof this.parameters>,
    context: ToolContext,
  ): Promise<UpdateChecklistResult> {
    const { id, ...updates } = params;
    const checklist = await this.checklistStore.update(
      id,
      updates,
      context.authUser,
    );

    return {
      success: true,
      checklist,
      message: `✅ Checklist "${checklist.name}" updated successfully.`,
    };
  }
}
