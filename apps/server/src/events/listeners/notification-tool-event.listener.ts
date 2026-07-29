import { InjectRedis } from "@nestjs-modules/ioredis";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import {
  LLMModelTypes,
  LLMProviderService,
} from "../../ai/llm/llm.provider.sevice";
import { NotificationService } from "../../core/services/notification.service";
import { LogStore } from "../../core/stores/monitoring/log/log.store";
import { PendingActionStore } from "../../core/stores/pending-action/pending-action.store";
import { ToolStore } from "../../core/stores/tool/tool.store";
import { ApproveActionTool } from "../../tools/default/pending-action/approve-action.tool";
import { RejectActionTool } from "../../tools/default/pending-action/reject-action.tool";
import {
  TOOL_EXECUTION_EVENT_CHANNEL,
  ToolExecutionEvent,
} from "../contracts/tool-execution.event";
import { ApproveActionToolSchema } from "../../tools/default/pending-action/approve-action.tool";

@Injectable()
export class NotificationToolEventListener
  implements OnModuleInit, OnModuleDestroy
{
  private subscriber?: Redis;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly notificationService: NotificationService,
    private readonly logStore: LogStore,
    private readonly pendingActionStore: PendingActionStore,
    private readonly toolStore: ToolStore,
    private readonly llmProviderService: LLMProviderService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.subscriber = this.redis.duplicate();

    await this.subscriber.subscribe(TOOL_EXECUTION_EVENT_CHANNEL);
    this.subscriber.on("message", async (_channel, payload) => {
      try {
        const event = JSON.parse(payload) as ToolExecutionEvent;
        await this.processEvent(event);
      } catch (error: any) {
        await this.logStore.create({
          severity: "error",
          message: `NotificationToolEventListener: failed to process tool event`,
          metadata: {
            error: error?.message ?? String(error),
          },
        });
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.quit();
      this.subscriber = undefined;
    }
  }

  /**
   * Publishes a follow-up tool event to the same pub/sub channel (e.g. defer “real” tool
   * notifications until after approve/reject handling). Swallows publish errors.
   */
  private async emitToolExecutionEventToPubSub(
    event: ToolExecutionEvent,
  ): Promise<void> {
    try {
      await this.redis.publish(
        TOOL_EXECUTION_EVENT_CHANNEL,
        JSON.stringify(event),
      );
    } catch (err: any) {
      await this.logStore.create({
        severity: "warn",
        message: `NotificationToolEventListener: failed to emit tool event to pub/sub`,
        metadata: { error: err?.message ?? String(err) },
      });
    }
  }

  private async processEvent(event: ToolExecutionEvent): Promise<void> {
    if (event.approval?.action === "requested") {
      await this.processOnRequested(event);
      return;
    }

    if (
      event.toolName === ApproveActionTool.toolName ||
      event.toolName === RejectActionTool.toolName
    ) {
      await this.processOnRequestComplete(event);
      return;
    }

    await this.processDefaultToolExecuted(event);
  }

  /** Approval was requested for a deferred tool: notify users who can approve (write on target tool). */
  private async processOnRequested(event: ToolExecutionEvent): Promise<void> {
    const context = {
      isNotifying: false,
      isRequesting: true,
    } as const;
    const shouldNotify = await this.notificationService.hasUsersToNotifyByTool(
      event.toolName,
      event.userId,
      context,
    );
    if (!shouldNotify) {
      return;
    }

    const message = await this.generateApprovalRequestedMessage(event);
    await this.notificationService.notifyUsersByTool(
      message,
      event.toolName,
      event.userId,
      context,
      "medium",
    );
  }

  private async generateApprovalRequestedMessage(
    event: ToolExecutionEvent,
  ): Promise<string> {
    const fallback = `Approval requested for tool: ${event.toolName}`;
    try {
      const proposedArgsJson = JSON.stringify(
        event.argsSummary ?? null,
        null,
        2,
      );

      const readableHint =
        event.approval?.pendingActionReadableId != null
          ? `#${event.approval.pendingActionReadableId}`
          : "unknown";

      const prompt = `You are Home AI. Write ONE short notification for approvers who will see this via a push notification.
Someone requested approval to run tool "${event.toolName}" (request id ${readableHint}).
Full proposed arguments (JSON):
${proposedArgsJson}

Requirements:
- One or two sentences maximum. Friendly and clear; match mild urgency (approval needed).
- Infer what the action is from the tool name and args when possible.
- Plain text only. No markdown, no bullet lists.`;

      const response = await this.llmProviderService.query(
        {
          messages: [{ role: "system", content: prompt }],
          context: {
            userId: event.userId,
            originalPrompt: `Notification listener: approval requested for ${event.toolName}`,
            chatSessionId: `notification:approval-requested:${event.userId}`,
          },
        },
        LLMModelTypes.SOON,
      );

      const text =
        typeof response.content === "string" ? response.content.trim() : "";
      return text.length > 0 ? text : fallback;
    } catch (err: any) {
      await this.logStore.create({
        severity: "warn",
        message: `NotificationToolEventListener: LLM failed for approval-requested message`,
        metadata: {
          toolName: event.toolName,
          error: err?.message ?? String(err),
        },
      });
      return fallback;
    }
  }

  /**
   * Approve or reject tool completed in the orchestrator: notify the original requester,
   * then requeue a plain tool-executed event for the underlying tool so tool-based
   * notify rules / other listeners see the deferred tool name.
   */
  private async processOnRequestComplete(
    event: ToolExecutionEvent,
  ): Promise<void> {
    const readableId = ApproveActionToolSchema.safeParse(event.argsSummary).data
      ?.readableId;
    if (readableId == null) {
      await this.logStore.create({
        severity: "warn",
        message: `NotificationToolEventListener: approve/reject event missing readableId`,
        metadata: { toolName: event.toolName },
      });
      return;
    }

    const pending = await this.pendingActionStore.getByReadableId(
      readableId,
      undefined,
      true,
    );
    if (!pending) {
      await this.logStore.create({
        severity: "warn",
        message: `NotificationToolEventListener: pending action not found for readableId`,
        metadata: { readableId, toolName: event.toolName },
      });
      return;
    }

    const isApprove = event.toolName === ApproveActionTool.toolName;
    const isReject = event.toolName === RejectActionTool.toolName;

    if (isApprove) {
      const message = `Your request #${readableId} was approved and completed.`;
      await this.notificationService.notifyUser(
        message,
        pending.requesterId,
        event.userId,
        "medium",
      );
    } else if (isReject) {
      const reason = pending.reason?.trim() || "No reason was provided.";
      const message = `Your request #${readableId} was declined: ${reason}`;
      await this.notificationService.notifyUser(
        message,
        pending.requesterId,
        event.userId,
        "medium",
      );
    }

    const tool = await this.toolStore.getById(pending.toolId, undefined);
    if (!tool) {
      await this.logStore.create({
        severity: "warn",
        message: `NotificationToolEventListener: tool not found for pending action`,
        metadata: { toolId: pending.toolId, readableId },
      });
      return;
    }

    // Requeue: same channel, no approval envelope — downstream behaves like a normal tool run.
    await this.emitToolExecutionEventToPubSub({
      eventType: "tool-executed",
      userId: pending.requesterId,
      toolName: tool.name,
      argsSummary: pending.proposedArgs,
      resultSummary: event.resultSummary,
    });
  }

  private async processDefaultToolExecuted(
    event: ToolExecutionEvent,
  ): Promise<void> {
    const context = {
      isNotifying: true,
      isRequesting: false,
    } as const;
    const shouldNotify = await this.notificationService.hasUsersToNotifyByTool(
      event.toolName,
      event.userId,
      context,
    );
    if (!shouldNotify) {
      return;
    }

    const message = await this.generateDefaultToolExecutedMessage(event);
    await this.notificationService.notifyUsersByTool(
      message,
      event.toolName,
      event.userId,
      context,
      "low",
    );
  }

  private async generateDefaultToolExecutedMessage(
    event: ToolExecutionEvent,
  ): Promise<string> {
    const fallback = `A tool was executed: ${event.toolName}`;
    try {
      const argsJson = JSON.stringify(event.argsSummary ?? null, null, 2);
      const resultJson = JSON.stringify(event.resultSummary ?? null, null, 2);

      const prompt = `You are Home AI. Write ONE short informational notification for household members who subscribe to alerts for this tool.
Tool name: "${event.toolName}"
Actor user id (who ran it): ${event.userId}

Full tool arguments (JSON):
${argsJson}

Full tool result payload (JSON):
${resultJson}

Requirements:
- One or two sentences maximum. Friendly, factual tone (something ran successfully — not an alarm).
- Say what happened in plain language using tool name and payload when helpful.
- Plain text only. No markdown, no bullet lists.`;

      const response = await this.llmProviderService.query(
        {
          messages: [{ role: "system", content: prompt }],
          context: {
            userId: event.userId,
            originalPrompt: `Notification listener: tool executed ${event.toolName}`,
            chatSessionId: `notification:tool-executed:${event.userId}`,
          },
        },
        LLMModelTypes.SOON,
      );

      const text =
        typeof response.content === "string" ? response.content.trim() : "";
      return text.length > 0 ? text : fallback;
    } catch (err: any) {
      await this.logStore.create({
        severity: "warn",
        message: `NotificationToolEventListener: LLM failed for default tool-executed message`,
        metadata: {
          toolName: event.toolName,
          error: err?.message ?? String(err),
        },
      });
      return fallback;
    }
  }
}
