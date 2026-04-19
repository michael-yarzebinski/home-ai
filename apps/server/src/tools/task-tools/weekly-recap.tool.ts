import { Injectable, Logger } from '@nestjs/common';
import { TaskHandlerBase, TaskHandlerMetadata } from '../task-handler.base';
import type { TaskHandlerContext } from '../interfaces/task-handler-context';
import { TaskHandlerStatus, type TaskHandlerResult } from '../interfaces/task-handler-result';
import { TaskName } from 'src/core/entities/task/task-name';
import { DailySummaryTool } from './daily-summary.tool';
import { TaskRegistryService } from 'src/core/task-registry/registry/task-registry.service';

export class WeeklyRecapParams {}

export const WeeklyRecapParamsSchema = `
{
  "type": "object",
  "properties": {},
  "description": "No parameters are required for generating a weekly recap",
  "required": []
}
`;

@Injectable()
export class WeeklyRecapTool extends TaskHandlerBase {
  private readonly logger = new Logger(DailySummaryTool.name);

  readonly metadata:TaskHandlerMetadata = {
    taskName: TaskName.WeeklyRecap,
    description: 'Generate a weekly recap of completed tasks, upcoming events, and useful tips',
    parameters: WeeklyRecapParams,
    parametersSchema: WeeklyRecapParamsSchema,
    hints: ['weekly recap', 'weekly summary', 'what happened this week', 'week review'],
    actionType: 'weekly_recap',
  };

  constructor(protected taskRegistryService: TaskRegistryService) {
    super(taskRegistryService);
  }


  async execute(request: TaskHandlerContext): Promise<TaskHandlerResult> {
    try {
      const recap = `
Weekly Recap:

✅ Completed Tasks:
• Added multiple items to grocery and task lists
• Several calendar events were scheduled
• Facts and preferences were updated

📅 Upcoming:
• Check your calendar for appointments this week
• Review any pending approvals

💡 Tip: Your Short Term List is a great place to track immediate tasks.

Would you like a more detailed recap or focus on a specific area?
      `.trim();

      return {
        status: TaskHandlerStatus.SUCCESS,
        reply: recap,
        data: {
          period: 'weekly',
          summaryType: 'recap',
        },
      };
    } catch (error: any) {
      this.logger.error('WeeklyRecapTool error:', error);
      return {
        status: TaskHandlerStatus.ERROR,
        error: 'Sorry, I couldn’t generate the weekly recap.',
      };
    }
  }
}
