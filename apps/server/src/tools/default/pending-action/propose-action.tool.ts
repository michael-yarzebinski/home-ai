import { z } from "zod";
import { ToolHandler } from "../../abstract/tool-handler";
import { PendingActionStore } from "../../../core/stores/pending-action/pending-action.store";
import { ToolStore } from "../../../core/stores/tool/tool.store";
import type { ToolContext } from "../../types/tool-context";
import { Injectable } from "@nestjs/common";
import { Tool } from "../../decorators/tool.decorator";

const ProposeActionToolSchema = z.object({
  toolName: z
    .string()
    .min(1)
    .describe(
      "The exact name of the tool that should be executed once approved",
    ),
  description: z
    .string()
    .min(5)
    .describe("A human-friendly description of what this action will do"),
  proposedArgs: z
    .record(z.string(), z.any())
    .optional()
    .describe("Arguments for the target tool"),
  reason: z
    .string()
    .optional()
    .describe("Explanation for why this is being requested"),
});

export interface ProposeActionResult {
  success: boolean;
  readableId: number;
  message: string;
}

@Tool()
@Injectable()
export class ProposeActionTool extends ToolHandler<
  typeof ProposeActionToolSchema,
  ProposeActionResult
> {
  readonly name = "propose-action";
  readonly description =
    "INTERNAL USE ONLY. This tool is managed by the system orchestrator for permission escalation. LLM should NOT call this tool directly.";
  readonly parameters = ProposeActionToolSchema;

  constructor(
    private readonly toolStore: ToolStore,
    private readonly pendingActionStore: PendingActionStore,
    // private readonly notificationService: NotificationService,
    // private readonly llmProviderService: LLMProviderService,
  ) {
    super();
  }

  async execute(
    params: z.infer<typeof ProposeActionToolSchema>,
    context: ToolContext,
  ): Promise<ProposeActionResult> {
    const tool = await this.toolStore.getByName(
      params.toolName,
      context.authUser,
    );

    if (!tool) {
      throw new Error(`Tool "${params.toolName}" not found.`);
    }

    const pendingAction = await this.pendingActionStore.create(
      {
        requesterId: context.authUser.id,
        toolId: tool.id,
        proposedArgs: params.proposedArgs || {},
        reason: params.reason,
        status: "pending",
      },
      context.authUser,
    );

    return {
      success: true,
      readableId: pendingAction.readableId,
      message: `I've sent your request (#${pendingAction.readableId}) for approval.`,
    };
  }
}
