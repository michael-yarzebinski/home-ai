import { Injectable, Logger } from '@nestjs/common';
import { ToolBase } from '../tool.base';
import type { ToolRequest } from '../../tools/interfaces/tool-request';
import type { ToolResult } from '../../tools/interfaces/tool-result';
import { RetrieveFactParams } from 'src/core/tasks/task-parameters';
import { FactsService } from '../../core/facts/facts.service';
import { TaskName } from 'src/core/tasks/task-name';
import { RegisterTool } from 'src/core/tools/decorators/register-tool.decorator';
import { ToolRegistryService } from 'src/core/tools/registry/tool-registry.service';

@Injectable()
@RegisterTool(TaskName.RetrieveFact)
export class RetrieveFactTool extends ToolBase {
  private readonly logger = new Logger(RetrieveFactTool.name);

  readonly metadata = {
    taskName: TaskName.RetrieveFact,
    description: 'Retrieve a previously stored fact or preference by key',
    parameterDto: RetrieveFactParams,
    hints: ['what did i say about', 'recall', 'remember what', 'what was', 'tell me about'],
    actionType: 'retrieve_fact',
  };

  constructor(protected toolRegistryService: ToolRegistryService, private readonly factsService: FactsService) {
    super(toolRegistryService);
  }

  async execute(request: ToolRequest): Promise<ToolResult> {
    const { parameters: params } = request.dispatchRequest;
    const typedParams = params as RetrieveFactParams;

    const key = typedParams.key;

    if (!key) {
      return {
        success: false,
        reply: 'What would you like me to recall?',
      };
    }

    try {
      const fact = await this.factsService.retrieveFact(key);

      if (!fact) {
        return {
          success: false,
          reply: `I don't have any information stored for "${key}".`,
        };
      }

      return {
        success: true,
        reply: `${key}: ${fact.value}`,
        data: fact,
      };
    } catch (error: any) {
      this.logger.error('RetrieveFactTool error:', error);
      return {
        success: false,
        reply: 'Sorry, I couldn’t look that up right now.',
      };
    }
  }
}
