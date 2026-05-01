// src/tools/default/discover-calendars.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import type { ToolContext } from '../../types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';
import { ToolUtils } from 'src/tools/utils/tool.utils';
import { CalendarSummary, CalendarSummarySchema } from './types/calendar.types';

const DiscoverCalendarsToolSchema = z.object({
  query: z
    .string()
    .optional()
    .describe('Optional search term to filter calendars by name'),
});

export interface DiscoverCalendarsResult {
  calendars: CalendarSummary[];
  total: number;
  message: string;
}

@Tool()
@Injectable()
export class DiscoverCalendarsTool extends ToolHandler<
  typeof DiscoverCalendarsToolSchema,
  DiscoverCalendarsResult
> {
  readonly name = 'discover-calendars';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'Discover calendars in the Apple Calendar app (external), for example before register-calendar in Home AI. ' +
    'For calendars already registered in Home AI, prefer list-calendars (permission-filtered).';

  readonly parameters = DiscoverCalendarsToolSchema;

  async execute(
    params: z.infer<typeof DiscoverCalendarsToolSchema>,
    context: ToolContext,
  ): Promise<DiscoverCalendarsResult> {
    const script = `
    tell application "Calendar"
      set theCalendars to every calendar
      set jsonOutput to "["
      set firstCalendar to true

      repeat with c in theCalendars
        set myName to name of c
        set {r, g, b} to color of c
        set r8 to (r / 256) as integer
        set g8 to (g / 256) as integer
        set b8 to (b / 256) as integer
        set colorValue to "rgb(" & r8 & "," & g8 & "," & b8 & ")"
        set calendarString to "{\\"name\\":\\"" & myName & "\\",\\"friendlyName\\":\\"" & myName & "\\",\\"color\\":\\"" & colorValue & "\\"}"

        if firstCalendar then
          set jsonOutput to jsonOutput & calendarString
          set firstCalendar to false
        else
          set jsonOutput to jsonOutput & "," & calendarString
        end if
      end repeat

      set jsonOutput to jsonOutput & "]"
      return jsonOutput
    end tell
    `;

    const result = await this.runAppleScript(script);
    let calendars = ToolUtils.parseArray(result, CalendarSummarySchema);

    if (params.query) {
      const term = params.query.toLowerCase();
      calendars = calendars.filter((c) => c.name.toLowerCase().includes(term));
    }

    return {
      calendars,
      total: calendars.length,
      message: `Found ${calendars.length} calendars in Apple Calendar.`,
    };
  }

}
