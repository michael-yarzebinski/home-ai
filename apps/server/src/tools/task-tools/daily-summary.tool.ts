import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TaskHandlerBase, TaskHandlerMetadata } from '../task-handler.base';
import type { TaskHandlerContext } from '../interfaces/task-handler-context';
import { TaskHandlerStatus, type TaskHandlerResult } from '../interfaces/task-handler-result';
import { TaskName } from 'src/core/entities/task/task-name';
import { ReadCalendarTool } from './read-calendar.tool';
import { RegisterTask } from 'src/core/task-registry/decorators/register-task.decorator';
import { TaskRegistryService } from 'src/core/task-registry/registry/task-registry.service';

export class DailySummaryParams {}

export const DailySummaryParamsSchema = `
{
  "type": "object",
  "properties": {},
  "description": "No parameters are required for generating a daily summary",
  "required": []
}
`;

@Injectable()
@RegisterTask(TaskName.DailySummary)
export class DailySummaryTool extends TaskHandlerBase {
  private readonly logger = new Logger(DailySummaryTool.name);

  readonly metadata: TaskHandlerMetadata = {
    taskName: TaskName.DailySummary,
    description: 'Generate a daily summary including weather, calendar events, and short term tasks',
    parameters: DailySummaryParams,
    parametersSchema: DailySummaryParamsSchema,
    hints: ['daily summary', 'what happened today', 'today summary', 'daily recap'],
    actionType: 'daily_summary',
  };

  constructor(
    protected taskRegistryService: TaskRegistryService,
    private readonly configService: ConfigService,
    private readonly readCalendarTool: ReadCalendarTool,
  ) {
    super(taskRegistryService);
  }

  async execute(request: TaskHandlerContext): Promise<TaskHandlerResult> {
    const zipCode = this.configService.get<string>('WEATHER_ZIP_CODE') || '90210';

    try {
      const weatherRes = await fetch(`https://wttr.in/${zipCode}?format=%C+%t+%w`);
      const weatherText = await weatherRes.text();

      const calendarRequest: TaskHandlerContext = {
          task: { taskName: TaskName.ReadCalendar } as any,
          user: request.user,
          parameters: { daysAhead: 0 },
          chatHistory: [],
        taskRequest: request.taskRequest,
      };

      const calendarResult = await this.readCalendarTool.execute(calendarRequest);
      const calendarData = calendarResult.status !== TaskHandlerStatus.ERROR ? calendarResult.reply : 'No events today.'

      const shortTermItems = '• Fold laundry\n• Buy milk\n• Schedule dentist';

      const summary = `
Today's Summary:

🌤️ Weather: ${weatherText.trim()}

📅 Calendar:
${calendarData}

📋 Short Term List:
${shortTermItems}
      `.trim();

      return {
        status: TaskHandlerStatus.SUCCESS,
        reply: summary,
        data: {
          weather: weatherText.trim(),
          calendar: calendarData,
          shortTerm: shortTermItems,
        },
      };
    } catch (error: any) {
      this.logger.error('DailySummaryTool error:', error);
      return {
        status: TaskHandlerStatus.ERROR,
        error: 'Sorry, I couldn’t generate today’s summary right now.',
      };
    }
  }
}
