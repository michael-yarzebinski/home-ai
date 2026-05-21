import { z } from "zod";
import { ToolHandler } from "../../abstract/tool-handler";
import { PendingActionStore } from "../../../core/stores/pending-action/pending-action.store";
import { ToolRegistry } from "../../registry/tool.registry";
import { NotificationService } from "../../../core/services/notification.service";
import type { ToolContext } from "../../types/tool-context";
import { Injectable } from "@nestjs/common";
import { Tool } from "../../decorators/tool.decorator";
import { LLMProviderService } from "../../../ai/llm/llm.provider.sevice";

export const ApproveActionToolSchema = z.object({
  readableId: z
    .number()
    .int()
    .positive()
    .describe("The readable ID of the pending action to approve (e.g. 42)"),
});

export interface ApproveActionResult {
  success: boolean;
  message: string;
  originalToolResult?: any;
}

@Tool()
@Injectable()
export class ApproveActionTool extends ToolHandler<
  typeof ApproveActionToolSchema,
  ApproveActionResult
> {
  static readonly toolName = "approve-action" as const;
  readonly name = ApproveActionTool.toolName;
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "Approve and execute a previously proposed action by its ID. " +
    'Only users with "write" permission for the target tool can approve.';

  readonly parameters = ApproveActionToolSchema;

  constructor(
    private readonly pendingActionStore: PendingActionStore,
    private readonly toolRegistry: ToolRegistry,
    private readonly notificationService: NotificationService,
    private readonly llmProviderService: LLMProviderService,
  ) {
    super();
  }

  async execute(
    params: z.infer<typeof ApproveActionToolSchema>,
    context: ToolContext,
  ): Promise<ApproveActionResult> {
    // 1. Fetch the action
    const pendingAction = await this.pendingActionStore.getByReadableId(
      params.readableId,
      context.authUser,
    );

    if (!pendingAction) {
      return {
        success: false,
        message: `No pending action found with ID #${params.readableId}`,
      };
    }

    if (pendingAction.status !== "pending") {
      return {
        success: false,
        message: `Action #${params.readableId} is already ${pendingAction.status}.`,
      };
    }

    // 2. Permission Check
    const originalTool = await this.toolRegistry.getRegisteredToolById(
      pendingAction.toolId,
      context.authUser,
    );

    if (!originalTool) {
      return {
        success: false,
        message: `The tool for this action is no longer available.`,
      };
    }

    if (!originalTool.canWrite) {
      return {
        success: false,
        message: `Access Denied: You do not have permission to approve this action.`,
      };
    }

    // 3. Deterministic Execution (Associate with the Approver's context)
    const result = await originalTool.handler.execute(
      pendingAction.proposedArgs as any,
      context,
    );

    // 4. Update Status in DB
    await this.pendingActionStore.approve(
      pendingAction.id,
      context.authUser.id,
      context.authUser,
    );

    return {
      success: true,
      message: `✅ Action #${params.readableId} approved and executed.`,
      originalToolResult: result,
    };
  }
}
