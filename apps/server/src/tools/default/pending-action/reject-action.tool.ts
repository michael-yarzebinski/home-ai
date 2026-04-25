import { z } from "zod";
import { ToolHandler } from "../../abstract/tool-handler";
import { PendingActionStore } from "../../../core/stores/pending-action/pending-action.store";
import { ToolRegistry } from "../../registry/tool.registry";
import { NotificationService } from "../../../core/services/notification.service";
import { LLMServiceBase } from "../../../ai/abstract/llm.service.base";
import type { ToolContext } from "../../types/tool-context";
import { Injectable } from "@nestjs/common";
import { Tool } from "../../decorators/tool.decorator";

const RejectActionToolSchema = z.object({
  readableId: z
    .number()
    .int()
    .positive()
    .describe("The readable ID of the pending action to reject (e.g. 42)"),
  reason: z
    .string()
    .min(3)
    .describe("Brief explanation for why the request was declined"),
});

export interface RejectActionResult {
  success: boolean;
  message: string;
}

@Tool()
@Injectable()
export class RejectActionTool extends ToolHandler<
  typeof RejectActionToolSchema,
  RejectActionResult
> {
  readonly name = "reject-action";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "Reject a previously proposed action. Requires a reason for the requester. " +
    'Only users with "write" permission for the target tool can reject requests.';

  readonly parameters = RejectActionToolSchema;

  constructor(
    private readonly pendingActionStore: PendingActionStore,
    private readonly toolRegistry: ToolRegistry,
    private readonly notificationService: NotificationService,
    private readonly llm: LLMServiceBase,
  ) {
    super();
  }

  async execute(
    params: z.infer<typeof RejectActionToolSchema>,
    context: ToolContext,
  ): Promise<RejectActionResult> {
    // 1. Fetch the action
    const pendingAction = await this.pendingActionStore.getByReadableId(
      params.readableId,
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
        message: `Action #${params.readableId} has already been ${pendingAction.status}.`,
      };
    }

    // 2. Permission Check (Same as approve, only authorized roles can reject)
    const originalTool = await this.toolRegistry.getRegisteredToolById(
      pendingAction.toolId,
      context.userRole,
    );

    if (!originalTool || !originalTool.canWrite) {
      return {
        success: false,
        message: `Access Denied: You do not have permission to manage this action.`,
      };
    }

    try {
      // 3. Mark as Rejected in DB
      // Assuming your store supports a reject method or general status update
      await this.pendingActionStore.update(pendingAction.id, {
        status: "rejected",
      });

      // 4. Generate a empathetic "rejection" notification
      const generationPrompt = `
        You are a Home AI. A request from a family member was just declined by an authorized user.
        
        CONTEXT:
        - Approver: ${context.userName || "A parent"}
        - Original Tool: ${originalTool.name}
        - Rejection Reason: "${params.reason}"
        - Request ID: #${pendingAction.readableId}

        TASK:
        Generate a polite, clear message to the ORIGINAL REQUESTER letting them know it was declined and why.
        Keep it brief and "Home-like" (not a corporate "Request Denied" error).
        
        RETURN PLAIN TEXT ONLY.
      `;

      const aiResponse = await this.llm.query({
        messages: [{ role: "system", content: generationPrompt }],
        context: {
          userId: context.userId,
          chatSessionId: context.chatSessionId,
          originalPrompt: `Generating rejection notification for #${pendingAction.readableId}`,
        },
      });

      const notifyMsg =
        typeof aiResponse.content === "string"
          ? aiResponse.content
          : `Your request #${pendingAction.readableId} was declined: ${params.reason}`;

      // 5. Notify the Requester
      await this.notificationService.notifyUser(
        notifyMsg,
        pendingAction.requesterId,
        context.userId,
        "medium",
      );

      return {
        success: true,
        message: `❌ Action #${params.readableId} has been rejected. Requester has been notified.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to reject #${params.readableId}: ${err.message}`,
      };
    }
  }
}
