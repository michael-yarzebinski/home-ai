import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import { PendingActionStore } from '../../../core/stores/pending-action/pending-action.store';
import { ToolRegistry } from '../../registry/tool.registry';
import { NotificationService } from '../../../core/services/notification.service';
import { LLMServiceBase } from '../../../ai/abstract/llm.service.base';
import type { ToolContext } from '../../types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from '../../decorators/tool.decorator';

const ApproveActionToolSchema = z.object({
  readableId: z
    .number()
    .int()
    .positive()
    .describe('The readable ID of the pending action to approve (e.g. 42)'),
});

export interface ApproveActionResult {
  success: boolean;
  message: string;
  originalToolResult?: any;
}

@Tool()
@Injectable()
export class ApproveActionTool extends ToolHandler<typeof ApproveActionToolSchema, ApproveActionResult> {
  readonly name = 'approve-action';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'Approve and execute a previously proposed action by its ID. ' +
    'Only users with "write" permission for the target tool can approve.';

  readonly parameters = ApproveActionToolSchema;

  constructor(
    private readonly pendingActionStore: PendingActionStore,
    private readonly toolRegistry: ToolRegistry,
    private readonly notificationService: NotificationService,
    private readonly llm: LLMServiceBase,
  ) {
    super();
  }

  async execute(
    params: z.infer<typeof ApproveActionToolSchema>,
    context: ToolContext,
  ): Promise<ApproveActionResult> {
    // 1. Fetch the action
    const pendingAction = await this.pendingActionStore.getByReadableId(params.readableId);

    if (!pendingAction) {
      return { success: false, message: `No pending action found with ID #${params.readableId}` };
    }

    if (pendingAction.status !== 'pending') {
      return { success: false, message: `Action #${params.readableId} is already ${pendingAction.status}.` };
    }

    // 2. Permission Check
    const originalTool = await this.toolRegistry.getRegisteredToolById(
      pendingAction.toolId,
      context.userRole,
    );

    if (!originalTool) {
      return { success: false, message: `The tool for this action is no longer available.` };
    }

    if (!originalTool.canWrite) {
      return { success: false, message: `Access Denied: You do not have permission to approve this action.` };
    }

    try {
      // 3. Deterministic Execution (Associate with the Approver's context)
      const result = await originalTool.handler.execute(pendingAction.proposedArgs, context);

      // 4. Update Status in DB
      await this.pendingActionStore.approve(pendingAction.id, context.userId);

      // 5. Generate a personalized notification for the original requester
      const generationPrompt = `
        You are a Home AI. An action requested by a family member was just approved and executed.
        
        CONTEXT:
        - Approver: ${context.userName || 'A parent'}
        - Original Tool: ${originalTool.name}
        - Action Result: ${JSON.stringify(result)}
        - Request ID: #${pendingAction.readableId}

        TASK:
        Generate a short, friendly message to the ORIGINAL REQUESTER letting them know it's done. 
        Example: "Good news! [Approver] approved your request to [Action]. It's all set."

        RETURN PLAIN TEXT ONLY.
      `;

      const aiResponse = await this.llm.query({
        messages: [{ role: 'system', content: generationPrompt }],
        context: {
          userId: context.userId,
          chatSessionId: context.chatSessionId,
          originalPrompt: `Generating approval notification for #${pendingAction.readableId}`
        }
      });

      const notifyMsg = typeof aiResponse.content === 'string' ? aiResponse.content : "Your request was approved and executed!";

      // 6. Notify the Requester
      await this.notificationService.notifyUser(
        notifyMsg,
        pendingAction.requesterId, // Send to the person who asked
        context.userId,            // From the person who approved
        "medium"
      );

      return {
        success: true,
        message: `✅ Action #${params.readableId} approved and executed.`,
        originalToolResult: result,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Execution failed for #${params.readableId}: ${err.message}`,
      };
    }
  }
}