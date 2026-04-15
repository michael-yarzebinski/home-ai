import { Injectable, Logger } from '@nestjs/common';
import { ToolBase } from '../tool.base';
import type { ToolRequest } from '../../tools/interfaces/tool-request';
import type { ToolResult } from '../../tools/interfaces/tool-result';
import { StoreFactParams } from 'src/core/tasks/task-parameters';
import { FactsService } from '../../core/facts/facts.service';
import { TaskName } from 'src/core/tasks/task-name';
import { RegisterTool } from 'src/core/tools/decorators/register-tool.decorator';
import { ToolRegistryService } from 'src/core/tools/registry/tool-registry.service';

@Injectable()
@RegisterTool(TaskName.StoreFact)
export class StoreFactTool extends ToolBase {
  private readonly logger = new Logger(StoreFactTool.name);

  readonly metadata = {
    taskName: TaskName.StoreFact,
    description: 'Store a new fact, preference, or piece of information for later recall',
    parameterDto: StoreFactParams,
    hints: ['remember that', 'store fact', 'remember this', 'save that', 'note that'],
    actionType: 'store_fact',
  };

  constructor(protected toolRegistryService: ToolRegistryService, private readonly factsService: FactsService) {
    super(toolRegistryService);
  }

  async execute(request: ToolRequest): Promise<ToolResult> {
    const { parameters: params } = request.dispatchRequest;
    const typedParams = params as StoreFactParams;

    const key = typedParams.key;
    const value = typedParams.value;

    if (!key || !value) {
      return {
        success: false,
        reply: 'Please tell me both what to remember and the details (e.g. "Remember Mike\'s Chipotle order is a burrito with guacamole").',
      };
    }

    try {
      await this.factsService.storeFact(
        key,
        value,
        params.user?.userId || null
      );

      return {
        success: true,
        reply: `Got it! I'll remember "${key}" as "${value}".`,
      };
    } catch (error: any) {
      this.logger.error('StoreFactTool error:', error);
      return {
        success: false,
        reply: 'Sorry, I couldn’t save that information right now.',
      };
    }
  }
}
