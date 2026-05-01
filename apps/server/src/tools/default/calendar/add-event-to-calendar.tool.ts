// src/tools/default/add-event-to-calendar.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import type { ToolContext } from '../../types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';
import { ToolParameterUtils } from 'src/tools/utils/tool-parameter-utils';

const AddEventToCalendarToolSchema = z.object({
  title: z.preprocess(ToolParameterUtils.stripQuotes, z.string().min(1)).describe('Title of the event'),

  startDateTime: z
    .preprocess(ToolParameterUtils.formatForAppleScriptDate, z.string().min(1))
    .describe(
      'Start date and time of the event. Can be an ISO string or natural language (e.g. "2025-04-25 19:00"); coerced to en-US for AppleScript.',
    ),

  endDateTime: z
    .preprocess((value) => {
      if (ToolParameterUtils.isEmptyOptionalInput(value)) return undefined;
      return ToolParameterUtils.formatForAppleScriptDate(value);
    }, z.string().optional())
    .describe('End date and time of the event.  If the user does not provide an end time, use the start time plus 1 hour.'),

  location: z.preprocess(ToolParameterUtils.stripQuotes, z.string().optional()).describe('Optional location of the event'),

  notes: z.preprocess(ToolParameterUtils.stripQuotes, z.string().optional()).describe('Optional notes or description for the event'),

  calendarName: z
    .preprocess((value) => {
      const s = ToolParameterUtils.stripQuotes(value);
      return typeof s === 'string' && s.length > 0 ? s : undefined;
    }, z.string())
    .describe(
      'Calendar `name` from list-calendars (calendars registered in Home AI; not friendlyName). Must be a calendar this user may write to.',
    ),
});

export interface AddEventToCalendarResult {
  success: boolean;
  message: string;
  eventId?: string;
}

@Tool()
@Injectable()
export class AddEventToCalendarTool extends ToolHandler<
  typeof AddEventToCalendarToolSchema,
  AddEventToCalendarResult
> {
  readonly name = 'add-event-to-calendar';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'Add a new event to Apple Calendar. Always call list-calendars first; `calendarName` must match a calendar `name` registered in Home AI. ' +
    'Do not pick names only from discover-calendars unless the user is registering that calendar in Home AI first.';

  readonly parameters = AddEventToCalendarToolSchema;

  async execute(
    params: z.infer<typeof AddEventToCalendarToolSchema>,
    context: ToolContext,
  ): Promise<AddEventToCalendarResult> {

    const script = `tell application "Calendar" to tell calendar "${params.calendarName}" to return uid of (make new event with properties {summary:"${params.title}", start date:date "${params.startDateTime}"${params.endDateTime ? `, end date:date "${params.endDateTime}"` : ''}${params.location ? `, location:"${params.location}"` : ''}${params.notes ? `, description:"${params.notes}"` : ''}})`;
    
    const result = await this.runAppleScript(script);
    const eventId = result.trim();

    return {
      success: true,
      message: `✅ Event "${params.title}" has been added to the calendar.`,
      eventId: eventId || undefined,
    };
  }
}
