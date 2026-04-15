import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TaskRequestsService } from '../../core/task-requests/task-requests.service';
import { ToolBase } from '../../tools/tool.base';
import type { DispatchRequest } from '../../tools/interfaces/dispatch-request';
import type { ToolRequest } from '../../tools/interfaces/tool-request';
import { DispatchResult } from '../../tools/interfaces/dispatch-result';
import { TaskRequest } from 'src/core/task-requests/task-request.domain';
import { ALL_TOOLS } from '../../tools/all-tools';
import { ValidationService } from 'src/core/validation/validation.service';
import { ToolRegistryService } from 'src/core/tools/registry/tool-registry.service';
import { TaskName } from 'src/core/tasks/task-name';

@Injectable()
export class ToolRouter {
  constructor(
    private readonly taskRequestsService: TaskRequestsService,
    private readonly validationService: ValidationService,
    private readonly toolRegistry: ToolRegistryService,
  ) {
  }

  getToolForTask(taskName: TaskName | string): ToolBase | undefined {
    const tool = this.toolRegistry.getToolForTask(taskName);
    
    if (!tool) {
      // this.logger.warn(`No tool registered for task: ${taskName}`);
      return undefined;
    }

    return tool;
  }

  /**
   * Dispatches to the appropriate tool after creating a task_request record.
   * Uses DispatchRequest for all required context (task, user, permissions, parameters).
   */
  async dispatch(request: DispatchRequest): Promise<DispatchResult> {
    const matchingTool = this.getToolForTask(request.task.taskName);
    if (!matchingTool) {
      if (request.task.taskName === 'show_pending_approvals') {
        return this.handlePendingApprovals();
      }
      return {
        success: false,
        reply: `No handler for task: ${request.task.taskName}`,
      };
    }

    const toolParamType = matchingTool.metadata.parameterDto;

    let params: any;
    try {
      params = await this.validationService.validateAndTransform(
        request.parameters, 
        toolParamType
      );
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        // Return a clarification event that the orchestrator understands
        return {
          success: false,
          reply: error.message,
          clarificationNeeded: true,
          clarificationQuestion: error.message,
        };
      }
      
      throw error;
    }


    // Create task_request (core of the security invariant)
    const taskRequest: TaskRequest = {
      taskName: request.task.taskName,
      requesterUserId: request.user.id,
      executorUserId: request.user.id,
      parameters: request.parameters,
      status: 'executed',
      sourceType: '', // TODO: Fix this
      requiresApproval: !request.permission.canExecute,
      quietHoursQueued: false,
      // TODO:
      // Clean these up
      id: Math.floor(Math.random() * 10000),
      createdAt: new Date(),
    };
    const createdTaskRequest = await this.taskRequestsService.create(taskRequest);
    

    const toolRequest: ToolRequest = {
      dispatchRequest: {
        ...request,
        parameters: params,
      },
      taskRequest: createdTaskRequest,
    };

    try {
      const result = await matchingTool.execute(toolRequest);
      return {
        ...result,
        taskRequest: createdTaskRequest,
      };
    } catch (error: any) {
      console.error(`Tool execution failed for ${request.task.taskName}:`, error);
      return {
        success: false,
        reply: error.message || 'Tool execution failed',
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
      reply: 'Listed pending approvals',
      data: rows,
    };
  }
}
