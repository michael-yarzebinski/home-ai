import { z } from "zod";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ChecklistStore } from "src/features/checklist/stores/checklist.store";
import { Role } from "@home-ai/shared/domain/role/role";
import { Checklist } from "@home-ai/shared/domain/checklist/checklist";
import { ToolContext } from "src/tools/types/tool-context";
import { ToolParameterUtils } from "src/tools/utils/tool-parameter-utils";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";

const AddChecklistToolSchema = z.object({
  name: z
    .preprocess(ToolParameterUtils.stripQuotes, z.string().min(1))
    .describe(
      "The name of the checklist (e.g., 'Groceries', 'Server Maintenance')",
    ),
  description: z
    .preprocess(
      (v) =>
        ToolParameterUtils.isEmptyOptionalInput(v)
          ? undefined
          : ToolParameterUtils.stripQuotes(v),
      z.string().optional(),
    )
    .describe("Optional short summary of what this checklist is used for"),
  readRoles: z
    .preprocess(ToolParameterUtils.toRoleArray, z.array(z.enum(Role)))
    .optional()
    .describe("Roles allowed to view checklist items (supports 'all')"),
  writeRoles: z
    .preprocess(ToolParameterUtils.toRoleArray, z.array(z.enum(Role)))
    .optional()
    .describe(
      "Roles allowed to create/update checklist items (supports 'all')",
    ),
});

export interface AddChecklistResult {
  success: boolean;
  message: string;
  checklist: Checklist;
}

@Tool()
@Injectable()
export class AddChecklistTool extends ToolHandler<
  typeof AddChecklistToolSchema,
  AddChecklistResult
> {
  readonly name = "add-checklist";
  readonly description =
    "Creates a new checklist container. Useful for starting a new project or category of tasks.";

  readonly parameters = AddChecklistToolSchema;

  constructor(private readonly checklistStore: ChecklistStore) {
    super();
  }

  async execute(
    params: z.infer<typeof this.parameters>,
    context: ToolContext,
  ): Promise<AddChecklistResult> {
    const readRoles = params.readRoles?.length
      ? params.readRoles
      : [context.userRole];
    const writeRoles = params.writeRoles?.length
      ? params.writeRoles
      : [context.userRole];

    const checklist = await this.checklistStore.create(
      {
        name: params.name,
        description: params.description,
        readRoles,
        writeRoles,
      },
      context.user,
    );

    return {
      success: true,
      checklist,
      message: `✅ Checklist "${params.name}" has been added successfully.`,
    };
  }
}
