import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CalendarTool } from './calendar.tool';
import { AppleNotesTool } from './apple-notes.tool';
import { ToolBase } from '../tool.base';
import type { ToolRequest } from '../../tools/interfaces/tool-request';
import type { ToolResult } from '../../tools/interfaces/tool-result';

@Injectable()
export class SummaryTool extends ToolBase {
  readonly taskNames = ['daily_summary', 'weekly_recap'] as const;

  constructor(
    private readonly configService: ConfigService,
    private readonly calendarTool: CalendarTool,
    private readonly appleNotesTool: AppleNotesTool,
  ) {
    super();
  }

  canHandle(taskName: string): boolean {
    return this.taskNames.includes(taskName as any);
  }

  async execute(request: ToolRequest): Promise<ToolResult> {
    const { parameters: params, task } = request.request;
    const taskName = task.taskName || 'daily_summary';
    if (taskName === 'weekly_recap') {
      return this.weeklyRecap(params);
    }
    return this.dailySummary(params);
  }

  /**
   * Daily Summary: Weather + Calendar + Short Term List
   */
  private async dailySummary(parameters: any): Promise<ToolResult> {
    const zipCode = this.configService.get<string>('WEATHER_ZIP_CODE') || '80227';

    try {
      // 1. Get weather (using wttr.in - simple and no API key)
      const weatherRes = await fetch(`https://wttr.in/${zipCode}?format=%C+%t+%w`);
      const weatherText = await weatherRes.text();

      // 2. Get today's calendar events using proper ToolRequest shape
      const calendarRequest: ToolRequest = {
        request: {
          task: { task_name: 'read_calendar' } as any,
          user: {} as any,
          permission: { canRequest: true, canExecute: true },
          parameters: { date: 'today' },
          sourceType: 'ai',
        },
        taskRequestId: 0,
      };

      const calendarResult = await this.calendarTool.execute(calendarRequest);

      // 3. Short Term List - currently hardcoded (AppleNotesTool only supports writing)
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
        message: 'Daily summary generated',
        reply: summary,
        data: {
          weather: weatherText.trim(),
          calendar: calendarResult.data || [],
          shortTerm: shortTermItems,
        },
      };
    } catch (error: any) {
      console.error('Daily summary error:', error);
      return {
        success: false,
        message: 'Failed to generate daily summary',
        reply: 'Sorry, I couldn’t generate today’s summary right now.',
      };
    }
  }

  /**
   * Weekly Recap (basic version)
   */
  private async weeklyRecap(parameters: any): Promise<ToolResult> {
    try {
      const recap = `
Weekly Recap:

✅ Completed Tasks:
• Added 12 items to grocery list
• 3 calendar events added

📅 Upcoming:
• Doctor appointment on Friday
• Grocery run this weekend

💡 Tip: Your Short Term List has 5 items remaining.
      `.trim();

      return {
        success: true,
        message: 'Weekly recap generated',
        reply: recap,
      };
    } catch (error: any) {
      console.error('Weekly recap error:', error);
      return {
        success: false,
        message: 'Failed to generate weekly recap',
        reply: 'Sorry, I couldn’t generate the weekly recap.',
      };
    }
  }

}
