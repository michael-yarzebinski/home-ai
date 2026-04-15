import { Injectable, Logger } from '@nestjs/common';
import { ToolBase } from '../tool.base';
import type { ToolRequest } from '../../tools/interfaces/tool-request';
import type { ToolResult } from '../../tools/interfaces/tool-result';
import { WeeklyRecapParams } from 'src/core/tasks/task-parameters';
import { TaskName } from 'src/core/tasks/task-name';
import { DailySummaryTool } from './daily-summary.tool';
import { ToolRegistryService } from 'src/core/tools/registry/tool-registry.service';

@Injectable()
export class WeeklyRecapTool extends ToolBase {
  private readonly logger = new Logger(DailySummaryTool.name);

  readonly metadata = {
    taskName: TaskName.WeeklyRecap,
    description: 'Generate a weekly recap of completed tasks, upcoming events, and useful tips',
    parameterDto: WeeklyRecapParams,
    hints: ['weekly recap', 'weekly summary', 'what happened this week', 'week review'],
    actionType: 'weekly_recap',
  };

  constructor(protected toolRegistryService: ToolRegistryService) {
    super(toolRegistryService);
  }


  async execute(request: ToolRequest): Promise<ToolResult> {
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
        success: true,
        reply: recap,
        data: {
          period: 'weekly',
          summaryType: 'recap',
        },
      };
    } catch (error: any) {
      this.logger.error('WeeklyRecapTool error:', error);
      return {
        success: false,
        reply: 'Sorry, I couldn’t generate the weekly recap.',
      };
    }
  }
}
