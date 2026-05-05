// src/tools/default/update-calendar-event.tool.ts
import { z } from 'zod';
import { ToolHandler } from 'src/tools/abstract/tool-handler';
import { ToolContext } from 'src/tools/types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';
import { ToolParameterUtils } from 'src/tools/utils/tool-parameter-utils';
import { RelayService } from '../../../integrations/relay/relay.service';

const UpdateCalendarEventToolSchema = z.object({
  uid: z
    .preprocess(ToolParameterUtils.stripQuotes, z.string().min(1))
    .describe('The unique event ID (UID) from Apple Calendar for the event to update'),

  title: z
    .preprocess((v) => (ToolParameterUtils.isEmptyOptionalInput(v) ? undefined : ToolParameterUtils.stripQuotes(v)), z.string().optional())
    .describe('New title for the event'),

  startDateTime: z
    .preprocess((v) => (ToolParameterUtils.isEmptyOptionalInput(v) ? undefined : ToolParameterUtils.formatForAppleScriptDate(v)), z.string().optional())
    .describe(
      'Start date and time of the event.',
    ),

  endDateTime: z
    .preprocess((v) => (ToolParameterUtils.isEmptyOptionalInput(v) ? undefined : ToolParameterUtils.formatForAppleScriptDate(v)), z.string().optional())
    .describe('End date and time of the event.'),

  location: z
    .preprocess((v) => (ToolParameterUtils.isEmptyOptionalInput(v) ? undefined : ToolParameterUtils.stripQuotes(v)), z.string().optional())
    .describe('New location'),

  notes: z
    .preprocess((v) => (ToolParameterUtils.isEmptyOptionalInput(v) ? undefined : ToolParameterUtils.stripQuotes(v)), z.string().optional())
    .describe('New notes/description'),

  calendarName: z
    .preprocess((value) => {
      const s = ToolParameterUtils.stripQuotes(value);
      return typeof s === 'string' && s.length > 0 ? s : undefined;
    }, z.string())
    .describe(
      'Calendar `name` from list-calendars (calendars registered in Home AI; not friendlyName) that contains the event. Use at most once per user request unless the tool returns an error.',
    ),
}).refine(
  (value) =>
    value.title !== undefined ||
    value.startDateTime !== undefined ||
    value.endDateTime !== undefined ||
    value.location !== undefined ||
    value.notes !== undefined,
  {
    message: "Provide at least one field to update.",
    path: ["title"],
  },
);

export interface UpdateCalendarEventResult {
  success: boolean;
  message: string;
}

@Tool()
@Injectable()
export class UpdateCalendarEventTool extends ToolHandler<
  typeof UpdateCalendarEventToolSchema,
  UpdateCalendarEventResult
> {
  readonly name = 'update-calendar-event';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'Update an existing event in Apple Calendar. Always call list-calendars first; `calendarName` must match a calendar `name` registered in Home AI. ' +
    'Use `uid` from get-calendar-events for the event to change.';

  readonly parameters = UpdateCalendarEventToolSchema;

  constructor(private readonly relayService: RelayService) {
    super();
  }


  async execute(
    params: z.infer<typeof UpdateCalendarEventToolSchema>,
    context: ToolContext,
  ): Promise<UpdateCalendarEventResult> {
    const updateStatements: string[] = [];
    if (params.title !== undefined) {
      updateStatements.push(`set summary to "${params.title}"`);
    }
    if (params.startDateTime !== undefined) {
      updateStatements.push(`set start date to date "${params.startDateTime}"`);
    }
    if (params.endDateTime !== undefined) {
      updateStatements.push(`set end date to date "${params.endDateTime}"`);
    }
    if (params.location !== undefined) {
      updateStatements.push(`set location to "${params.location}"`);
    }
    if (params.notes !== undefined) {
      updateStatements.push(`set description to "${params.notes}"`);
    }

    const script = `
tell application "Calendar"
  set targetCalendar to calendar "${params.calendarName}"
  set theEvent to missing value
  
  try
    set theEvent to (first event of targetCalendar whose uid is "${params.uid}")
  end try

  if theEvent is missing value then
    ${params.title !== undefined
        ? `try
      set theEvent to (first event of targetCalendar whose summary is "${params.title}")
    end try`
        : ""}
  end if

  if theEvent is missing value then
    error "Event not found for uid: ${params.uid}" number -1728
  end if

  tell theEvent
    ${updateStatements.join("\n    ")}
  end tell
  
  return "Success"
end tell
`;

    await this.relayService.runAppleScript(script);

    return {
      success: true,
      message: `✅ Event has been updated successfully.`,
    };
  }
}
