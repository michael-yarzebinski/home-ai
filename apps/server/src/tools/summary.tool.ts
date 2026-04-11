import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Knex } from 'knex';
import { CalendarTool } from './calendar.tool';
import { AppleNotesTool } from './apple-notes.tool';

@Injectable()
export class SummaryTool {
  constructor(
    @Inject('KNEX_CONNECTION') private readonly knex: Knex,
    private readonly configService: ConfigService,
    private readonly calendarTool: CalendarTool,
    private readonly appleNotesTool: AppleNotesTool,
  ) {}

  /**
   * Daily Summary: Weather + Calendar + Short Term List
   */
  async dailySummary(
    parameters: any,
    user: any | null
  ): Promise<{
    success: boolean;
    message: string;
    reply: string;
    data?: any;
  }> {
    const zipCode = this.configService.get<string>('WEATHER_ZIP_CODE') || '90210';

    try {
      // 1. Get weather (using wttr.in - simple and no API key)
      const weatherRes = await fetch(`https://wttr.in/${zipCode}?format=%C+%t+%w`);
      const weatherText = await weatherRes.text();

      // 2. Get today's calendar events
      const calendarResult = await this.calendarTool.readEvents({ date: 'today' }, user);

      // 3. Get Short Term List items (read the note)
      // For simplicity, we'll simulate reading the note. In production, add a readNote method to AppleNotesTool
      const shortTermItems = "• Fold laundry\n• Buy milk\n• Schedule dentist";

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
          calendar: calendarResult.data?.events || [],
          shortTerm: shortTermItems,
        },
      };
    } catch (error) {
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
  async weeklyRecap(
    parameters: any,
    user: any | null
  ): Promise<{
    success: boolean;
    message: string;
    reply: string;
  }> {
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
    } catch (error) {
      console.error('Weekly recap error:', error);
      return {
        success: false,
        message: 'Failed to generate weekly recap',
        reply: 'Sorry, I couldn’t generate the weekly recap.',
      };
    }
  }
}