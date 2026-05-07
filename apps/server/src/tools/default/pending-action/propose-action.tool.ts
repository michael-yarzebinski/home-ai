import { z } from "zod";
import { ToolHandler } from "../../abstract/tool-handler";
import { PendingActionStore } from "../../../core/stores/pending-action/pending-action.store";
import { NotificationService } from "../../../core/services/notification.service";
import { ToolStore } from "../../../core/stores/tool/tool.store";
import type { ToolContext } from "../../types/tool-context";
import { Injectable } from "@nestjs/common";
import { Tool } from "../../decorators/tool.decorator";
import {
  LLMModelTypes,
  LLMProviderService,
} from "../../../ai/llm/llm.provider.sevice";

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
    private readonly notificationService: NotificationService,
    private readonly llmProviderService: LLMProviderService,
  ) {
    super();
  }

  async execute(
    params: z.infer<typeof ProposeActionToolSchema>,
    context: ToolContext,
  ): Promise<ProposeActionResult> {
    const tool = await this.toolStore.getByName(params.toolName);

    if (!tool) {
      throw new Error(`Tool "${params.toolName}" not found.`);
    }

    // 1. Create the pending action record
    const pendingAction = await this.pendingActionStore.create({
      requesterId: context.userId,
      toolId: tool.id,
      proposedArgs: params.proposedArgs || {},
      reason: params.reason,
      status: "pending",
    });

    // 2. Use the LLM to generate warm, conversational messages
    // Including proposedArgs provides much better context for the generation
    const generationPrompt = `
      You are a helpful Home AI. A user has requested an action that requires approval.
      
      CONTEXT:
      - Requester: ${context.userName || "A family member"}
      - Tool: ${params.toolName}
      - Action Description: ${params.description}
      - Parameters: ${JSON.stringify(params.proposedArgs || {})}
      - Request ID: #${pendingAction.readableId}
      - Reason provided: ${params.reason || "None"}

      TASK:
      Generate two short messages:
      1. USER_FEEDBACK: A message to tell the requester that their request has been sent for approval.
      2. NOTIFICATION: A punchy, clear message for the notification pings (BlueBubbles). Use an emoji. 
         Reference specific parameters (like temperature or device name) if they make the notification clearer.

      JSON OUTPUT ONLY:
      {
        "userFeedback": "string",
        "notification": "string"
      }
    `;

    const response = await this.llmProviderService.query(
      {
        messages: [{ role: "system", content: generationPrompt }],
        jsonMode: true,
        context: {
          userId: context.userId,
          chatSessionId: context.chatSessionId,
          originalPrompt: `Generating messages for pending action #${pendingAction.readableId}`,
        },
      },
      LLMModelTypes.IMMEDIATE,
    );

    let messages = {
      userFeedback: `I've sent your request (#${pendingAction.readableId}) for approval.`,
      notification: `🔔 Approval needed: ${params.description} (#${pendingAction.readableId})`,
    };

    const parsed =
      typeof response.content === "string"
        ? JSON.parse(response.content)
        : response.content;
    if (parsed.userFeedback && parsed.notification) {
      messages = parsed;
    }

    // 3. Dispatch the high-importance notification
    await this.notificationService.notifyUsersByTool(
      messages.notification,
      params.toolName,
      context.userId,
      {
        isNotifying: false,
        isRequesting: true,
      },
      "high",
    );

    // 4. Return the result back to the Orchestrator
    return {
      success: true,
      readableId: pendingAction.readableId,
      message: messages.userFeedback,
    };
  }
}
