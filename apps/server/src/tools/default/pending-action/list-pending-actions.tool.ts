// src/tools/default/list-pending-actions.tool.ts
import { Injectable } from "@nestjs/common";
import { PendingActionStore } from "src/core/stores/pending-action/pending-action.store";
import { UserStore } from "src/core/stores/user/user.store";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { Tool } from "src/tools/decorators/tool.decorator";
import { ToolRegistry } from "src/tools/registry/tool.registry";
import { ToolContext } from "src/tools/types/tool-context";
import { z } from "zod";

type EnrichedPendingAction = {
  readableId: number;
  toolName: string;
  requesterName: string;
  proposedAt: Date;
  status: "pending" | "approved" | "rejected";
  proposedArgs: any;
  reason?: string;
};

const ListPendingActionsToolSchema = z.object({});

export interface ListPendingActionsResult {
  pendingActions: EnrichedPendingAction[];
  total: number;
  message: string;
}

@Tool()
@Injectable()
export class ListPendingActionsTool extends ToolHandler<
  typeof ListPendingActionsToolSchema,
  ListPendingActionsResult
> {
  readonly name = "list-pending-actions";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "List all pending actions that require approval. " +
    "Use this tool when an approver (Admin or Parent) wants to see what actions are waiting for approval.";

  readonly parameters = ListPendingActionsToolSchema;

  constructor(
    private readonly pendingActionStore: PendingActionStore,
    private readonly toolRegistry: ToolRegistry,
    private readonly userStore: UserStore,
  ) {
    super();
  }

  async execute(
    _params: z.infer<typeof ListPendingActionsToolSchema>,
    context: ToolContext,
  ): Promise<ListPendingActionsResult> {
    const pendingActions = await this.pendingActionStore.getAllPendingActions();
    const availableTools = await this.toolRegistry.getAvailableToolsForUser(
      context.requestUser,
    );
    const toolsMap = new Map(availableTools.map((t) => [t.id, t]));

    const requesterIds = [
      ...new Set(pendingActions.map((pa) => pa.requesterId)),
    ];
    const requesters = await this.userStore.getByIds(
      requesterIds,
      context.requestUser,
    );
    const requestersMap = new Map(requesters.map((u) => [u.id, u]));

    const enrichedActions: EnrichedPendingAction[] = [];

    for (const pa of pendingActions) {
      const tool = toolsMap.get(pa.toolId);
      if (!tool || !tool.canWrite) continue;

      const requester = requestersMap.get(pa.requesterId);
      if (!requester) continue;

      enrichedActions.push({
        readableId: pa.readableId,
        toolName: tool.name,
        requesterName: requester.name,
        proposedAt: pa.createdAt,
        status: pa.status,
        proposedArgs: pa.proposedArgs,
        reason: pa.reason,
      });
    }

    return {
      pendingActions: enrichedActions,
      total: enrichedActions.length,
      message:
        enrichedActions.length > 0
          ? `Found ${enrichedActions.length} pending action(s) awaiting approval.`
          : "No pending actions at this time.",
    };
  }
}
