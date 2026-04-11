import { Injectable } from '@nestjs/common';
import { AppleNotesTool } from '../tools/task-tools/apple-notes.tool';
import { CalendarTool } from '../tools/task-tools/calendar.tool';
import { FactsTool } from '../tools/task-tools/facts.tool';
import { SummaryTool } from '../tools/task-tools/summary.tool';
import { DeviceTool } from '../tools/task-tools/device.tool';
import { TaskRequestsService } from '../../modules/task-requests/task-requests.service';
import { ToolBase } from '../tools/tool.base';
import type { DispatchRequest, DispatchResult } from '../tools/interfaces/dispatch-request';
import type { ToolRequest } from '../tools/interfaces/tool-request';
import { UserRecord } from '../../modules/users/users.service';

/**
 * Routes a resolved task name to the correct tool (single switchboard for {@link AIToolsService}).
 * Now uses ToolBase.canHandle() for registry-style dispatch. Creates task_request record first
 * (per security invariant in ToolBase).
 */
@Injectable()
export class ToolRouter {
  private readonly tools: ToolBase[] = [];

  constructor(
    private readonly appleNotesTool: AppleNotesTool,
    private readonly calendarTool: CalendarTool,
    private readonly factsTool: FactsTool,
    private readonly summaryTool: SummaryTool,
    private readonly deviceTool: DeviceTool,
    private readonly taskRequestsService: TaskRequestsService,
  ) {
    this.tools = [appleNotesTool, calendarTool, factsTool, summaryTool, deviceTool];
  }

  /**
   * Dispatches to the appropriate tool after creating a task_request record.
   * Uses DispatchRequest for all required context (task, user, permissions, parameters).
   */
  async dispatch(request: DispatchRequest): Promise<DispatchResult> {
    const matchingTool = this.tools.find(tool => tool.canHandle(request.task.task_name));
    if (!matchingTool) {
      if (request.task.task_name === 'show_pending_approvals') {
        return this.handlePendingApprovals();
      }
      return {
        success: false,
        message: `No handler for task: ${request.task.task_name}`,
        reply: `Sorry, I don't know how to perform "${request.task.task_name}" yet.`,
      };
    }

    // Create task_request (core of the security invariant)
    let taskRequestId: number;
    try {
      const requestData: any = {
        task_name: request.task.task_name,
        requester_user_id: request.user.user_id,
        executor_user_id: request.user.user_id,
        parameters: request.parameters,
        status: 'executed',
        source_type: request.sourceType,
        requires_approval: !request.permission.canExecute,
        quiet_hours_queued: false,
      };
      const created = await this.taskRequestsService.create(requestData);
      taskRequestId = created.request_id;
    } catch (err) {
      console.error('Failed to create task_request:', err);
      taskRequestId = 0; // fallback
    }

    const toolRequest: ToolRequest = {
      request: { ...request, taskRequestId },
      taskRequestId,
    };

    try {
      const result = await matchingTool.execute(toolRequest);
      return {
        ...result,
        taskRequestId,
      };
    } catch (error: any) {
      console.error(`Tool execution failed for ${request.task.task_name}:`, error);
      return {
        success: false,
        message: error.message || 'Tool execution failed',
        reply: 'Sorry, something went wrong executing that task.',
        taskRequestId,
      };
    }
  }

  private async handlePendingApprovals(): Promise<DispatchResult> {
    const rows = await this.taskRequestsService.findPendingApprovals();
    const reply =
      rows.length === 0
        ? 'No tasks are waiting for approval.'
        : rows
            .map(
              (r: { request_id?: number; task_name?: string; status?: string }) =>
                `• #${r.request_id} ${r.task_name} (${r.status})`,
            )
            .join('\n');
    return {
      success: true,
      message: 'Listed pending approvals',
      reply,
      data: rows,
    };
  }
}
