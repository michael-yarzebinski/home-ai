// src/tools/default/read-calendar-events.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ToolContext } from '../../types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

const execAsync = promisify(exec);

const GetCalendarEventsToolSchema = z.object({
  dateQuery: z
    .string()
    .min(1)
    .describe(
      'Flexible date query: specific date, natural language, or range. Examples: "March 15th", "next Friday", "this weekend", "March 15th to March 20th", "tomorrow".',
    ),

  calendarName: z
    .string()
    .optional()
    .describe('Optional specific calendar name (e.g. "Family", "Work", "Personal")'),
});

export interface GetCalendarEventsResult {
  events: Array<{
    title: string;
    startTime: string;
    endTime?: string;
    location?: string;
    calendar: string;
  }>;
  totalEvents: number;
  message: string;
}

@Tool()
@Injectable()
export class GetCalendarEventsTool extends ToolHandler<
  typeof GetCalendarEventsToolSchema,
  GetCalendarEventsResult
> {
  readonly name = 'get-calendar-events';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'Read events from Apple Calendar for a specific date, natural language date, or date range. ' +
    'Examples: "March 15th", "next Friday", "this weekend", "March 15th to March 20th", "tomorrow".';

  readonly parameters = GetCalendarEventsToolSchema;

  async execute(
    params: z.infer<typeof GetCalendarEventsToolSchema>,
    context: ToolContext,
  ): Promise<GetCalendarEventsResult> {
    const calendarFilter = params.calendarName
      ? `whose calendar is "${params.calendarName}"`
      : '';

    const script = `
      tell application "Calendar"
        set theStartDate to date "${params.dateQuery}"
        set theEndDate to theStartDate + 1 * days  -- default to 1 day if no range is given
        
        -- Try to detect ranges like "March 15th to March 20th"
        set theQuery to "${params.dateQuery}"
        if theQuery contains " to " or theQuery contains " - " then
          set theEndDate to date (text -1 thru -1 of theQuery) -- crude, but works for many cases
        end if
        
        set theEvents to every event ${calendarFilter} whose start date is greater than or equal to theStartDate and start date is less than or equal to theEndDate
        
        set eventList to {}
        repeat with anEvent in theEvents
          set eventInfo to {
            title: summary of anEvent,
            startTime: start date of anEvent as string,
            endTime: end date of anEvent as string,
            location: location of anEvent,
            calendar: calendar of anEvent
          }
          copy eventInfo to end of eventList
        end repeat
        
        return eventList
      end tell
    `;

    try {
      const { stdout } = await execAsync(`osascript -e '${script}'`);
      const rawEvents = JSON.parse(stdout.trim() || '[]');

      const events = rawEvents.map((e: any) => ({
        title: e.title || 'Untitled Event',
        startTime: e.startTime,
        endTime: e.endTime,
        location: e.location || undefined,
        calendar: e.calendar || 'Calendar',
      }));

      return {
        events,
        totalEvents: events.length,
        message: `Found ${events.length} events.`,
      };
    } catch (err: any) {
      return {
        events: [],
        totalEvents: 0,
        message: `Failed to read calendar: ${err.message}`,
      };
    }
  }
}
