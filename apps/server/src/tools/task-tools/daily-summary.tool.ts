import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ToolBase } from '../tool.base';
import type { ToolRequest } from '../../tools/interfaces/tool-request';
import type { ToolResult } from '../../tools/interfaces/tool-result';
import { DailySummaryParams } from 'src/core/tasks/task-parameters';
import { TaskName } from 'src/core/tasks/task-name';
import { ReadCalendarTool } from './read-calendar.tool';
import { RegisterTool } from 'src/core/tools/decorators/register-tool.decorator';
import { ToolRegistryService } from 'src/core/tools/registry/tool-registry.service';

@Injectable()
@RegisterTool(TaskName.DailySummary)
export class DailySummaryTool extends ToolBase {
  private readonly logger = new Logger(DailySummaryTool.name);

  readonly metadata = {
    taskName: TaskName.DailySummary,
    description: 'Generate a daily summary including weather, calendar events, and short term tasks',
    parameterDto: DailySummaryParams,
    hints: ['daily summary', 'what happened today', 'today summary', 'daily recap'],
    actionType: 'daily_summary',
  };

  constructor(
    protected toolRegistryService: ToolRegistryService,
    private readonly configService: ConfigService,
    private readonly readCalendarTool: ReadCalendarTool,
  ) {
    super(toolRegistryService);
  }

  async execute(request: ToolRequest): Promise<ToolResult> {
    const zipCode = this.configService.get<string>('WEATHER_ZIP_CODE') || '90210';

    try {
      const weatherRes = await fetch(`https://wttr.in/${zipCode}?format=%C+%t+%w`);
      const weatherText = await weatherRes.text();

      const calendarRequest: ToolRequest = {
        dispatchRequest: {
          task: { taskName: TaskName.ReadCalendar } as any,
          user: request.dispatchRequest.user,
          permission: { canRequest: true, canExecute: true },
          parameters: { daysAhead: 0 },
          chatHistory: [],
        },
        taskRequest: request.taskRequest,
      };

      const calendarResult = await this.readCalendarTool.execute(calendarRequest);

      const shortTermItems = '• Fold laundry\n• Buy milk\n• Schedule dentist';

      const summary = `
Today's Summary:

🌤️ Weather: ${weatherText.trim()}

📅 Calendar:
${calendarResult.reply || 'No events today.'}

📋 Short Term List:
${shortTermItems}
      `.trim();

      return {
        success: true,
        reply: summary,
        data: {
          weather: weatherText.trim(),
          calendar: calendarResult.data || [],
          shortTerm: shortTermItems,
        },
      };
    } catch (error: any) {
      this.logger.error('DailySummaryTool error:', error);
      return {
        success: false,
        reply: 'Sorry, I couldn’t generate today’s summary right now.',
      };
    }
  }
}
