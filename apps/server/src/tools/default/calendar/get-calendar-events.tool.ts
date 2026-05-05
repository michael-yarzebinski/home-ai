// src/tools/default/read-calendar-events.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import type { ToolContext } from '../../types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';
import { ToolParameterUtils } from 'src/tools/utils/tool-parameter-utils';
import { ToolUtils } from 'src/tools/utils/tool.utils';
import { CalendarEvent, CalendarEventSchema } from './types/calendar.types';
import { RelayService } from '../../../integrations/relay/relay.service';

const GetCalendarEventsToolSchema = z.object({
  startDate: z
    .preprocess(
      ToolParameterUtils.formatForAppleScriptDate,
      z.string().min(1)
    )
    .describe(
      'The start date/time for the search. Always provide this as a specific timestamp ' +
      '(e.g., "2026-04-27 00:00:00"). If the user says "today", calculate the date based ' +
      'on the current context time.'
    ),

  endDate: z
    .preprocess(
      (value) => {
        if (!value || value === '' || value === null) return undefined;
        return ToolParameterUtils.formatForAppleScriptDate(value);
      },
      z.string().optional()
    )
    .describe(
      'The end date/time for the search. If the user specifies a range like "this weekend" ' +
      'or "next week", calculate the specific end timestamp. If omitted, the tool ' +
      'defaults to the end of the day specified in startDate.'
    ),

  calendarName: z
    .preprocess(
      ToolParameterUtils.stripQuotes,
      z.string()
    )
    .describe(
      'Calendar `name` from list-calendars (calendars registered in Home AI). Call list-calendars first if unknown.',
    ),
});

export interface GetCalendarEventsResult {
  events: CalendarEvent[];
  total: number;
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
    'Read events from Apple Calendar for a time range. Always call list-calendars first and use a calendar `name` registered in Home AI (not friendlyName). ' +
    'Compute concrete start/end timestamps from the user request.';

  readonly parameters = GetCalendarEventsToolSchema;

  constructor(private readonly relayService: RelayService) {
    super();
  }


  async execute(
    params: z.infer<typeof GetCalendarEventsToolSchema>,
    context: ToolContext,
  ): Promise<GetCalendarEventsResult> {
    const calendarTarget = `calendar "${params.calendarName}"`

    const script = `
    tell application "Calendar"
      set theStartDate to date "${params.startDate}"
      ${params.endDate
        ? `set theEndDate to date "${params.endDate}"`
        : `set theEndDate to theStartDate + (24 * hours) - 1`
      }
      
      set jsonOutput to "["
      
      -- If we are targeting one calendar, we wrap it in a list to use the same repeat logic
      set targetCalendars to ${params.calendarName ? `{${calendarTarget}}` : calendarTarget}
      
      set firstEvent to true
      
      repeat with aCalendar in targetCalendars
        set theEvents to (every event of aCalendar whose start date is greater than or equal to theStartDate and start date is less than or equal to theEndDate)
        
        repeat with anEvent in theEvents
          -- Get properties safely
          set eUID to uid of anEvent
          set eSummary to summary of anEvent
          set eStart to start date of anEvent as string
          set eEnd to end date of anEvent as string
          set loc to location of anEvent
          if loc is missing value then set loc to ""
          
          -- Building the JSON string piece by piece to avoid delimiter issues
          set eventString to "{\\"uid\\":\\"" & eUID & "\\",\\"title\\":\\"" & eSummary & "\\",\\"startTime\\":\\"" & eStart & "\\",\\"endTime\\":\\"" & eEnd & "\\",\\"location\\":\\"" & loc & "\\",\\"calendar\\":\\"" & (name of aCalendar) & "\\"}"
          
          if firstEvent then
            set jsonOutput to jsonOutput & eventString
            set firstEvent to false
          else
            set jsonOutput to jsonOutput & "," & eventString
          end if
        end repeat
      end repeat
      
      set jsonOutput to jsonOutput & "]"
      return jsonOutput
    end tell
  `;

    // Note: Standard AppleScript returns a proprietary list format. 
    // To move to production, we'll want to refactor this logic to JXA 
    // so we can use JSON.stringify() inside the script. [cite: 231]
    const result = await this.relayService.runAppleScript(script);

    const events = ToolUtils.parseArray(result, CalendarEventSchema);

    return {
      events,
      total: events.length,
      message: `Successfully retrieved ${events.length} events from ${params.calendarName ?? 'all calendars'}.`,
    };
  }
}