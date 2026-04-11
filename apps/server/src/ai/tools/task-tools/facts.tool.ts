import { Inject, Injectable } from '@nestjs/common';
import { ToolBase } from '../tool.base';
import type { ToolRequest } from '../../tools/interfaces/tool-request';
import type { ToolResult } from '../../tools/interfaces/tool-result';
import { FactsService } from '../../../modules/facts/facts.service';

@Injectable()
export class FactsTool extends ToolBase {
  readonly taskNames = ['store_fact', 'retrieve_fact'] as const;

  constructor(private readonly factsService: FactsService) {
    super();
  }

  canHandle(taskName: string): boolean {
    return this.taskNames.includes(taskName as any);
  }

  /**
   * Store a new fact / preference
   */
  async execute(request: ToolRequest): Promise<ToolResult> {
    const { parameters: params, task } = request.request;
    const taskName = task.task_name;
    if (taskName === 'retrieve_fact') {
      return this.retrieveFact(params);
    }

    const key = params.key || params.fact || params.name;
    const value = params.value || params.details || params.text;

    if (!key || !value) {
      return {
        success: false,
        message: 'Missing key or value for fact',
        reply: 'Please tell me both what to remember and the details (e.g. "Remember Mike\'s Chipotle order is a burrito with guacamole").',
      };
    }

    try {
      await this.factsService.storeFact(
        key,
        value,
        params.user?.user_id || null
      );

      return {
        success: true,
        message: `Stored fact: ${key}`,
        reply: `Got it! I'll remember "${key}" as "${value}".`,
      };
    } catch (error) {
      console.error('Store fact error:', error);
      return {
        success: false,
        message: 'Failed to store fact',
        reply: 'Sorry, I couldn’t save that information right now.',
      };
    }
  }

  /**
   * Retrieve a stored fact by key
   */
  private async retrieveFact(parameters: any): Promise<ToolResult> {
    const key = parameters.key || parameters.fact || parameters.name;

    if (!key) {
      return {
        success: false,
        message: 'No key provided',
        reply: 'What would you like me to recall?',
      };
    }

    try {
      const fact = await this.factsService.retrieveFact(key);

      if (!fact) {
        return {
          success: false,
          message: 'Fact not found',
          reply: `I don't have any information stored for "${key}".`,
        };
      }

      return {
        success: true,
        message: `Retrieved fact: ${key}`,
        reply: `${key}: ${fact.value}`,
        data: fact,
      };
    } catch (error) {
      console.error('Retrieve fact error:', error);
      return {
        success: false,
        message: 'Failed to retrieve fact',
        reply: 'Sorry, I couldn’t look that up right now.',
      };
    }
  }

}
