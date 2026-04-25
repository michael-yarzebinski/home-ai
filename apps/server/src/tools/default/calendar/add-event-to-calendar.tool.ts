// src/tools/default/add-event-to-calendar.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ToolContext } from '../../types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

const execAsync = promisify(exec);

const AddEventToCalendarToolSchema = z.object({
  title: z.string().min(1).describe('Title of the event'),

  startTime: z
    .string()
    .min(1)
    .describe(
      'Start time of the event. Can be an ISO string or natural language (e.g. "2025-04-25 19:00").',
    ),

  endTime: z.string().optional().describe('Optional end time of the event'),

  location: z.string().optional().describe('Optional location of the event'),

  notes: z.string().optional().describe('Optional notes or description for the event'),

  calendarName: z
    .string()
    .optional()
    .describe(
      'Name of the calendar to add the event to (e.g. "Family", "Work"). If omitted, uses default calendar.',
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
    'Add a new event to Apple Calendar. ' + 'Use this tool when the user wants to create a calendar event.';

  readonly parameters = AddEventToCalendarToolSchema;

  async execute(
    params: z.infer<typeof AddEventToCalendarToolSchema>,
    context: ToolContext,
  ): Promise<AddEventToCalendarResult> {
    const calendar = params.calendarName ? `calendar "${params.calendarName}"` : 'default calendar';

    const script = `
      tell application "Calendar"
        set theEvent to make new event at end of ${calendar} with properties {
          summary: "${params.title.replace(/"/g, '\\"')}",
          start date: date "${params.startTime}",
          ${params.endTime ? `end date: date "${params.endTime}",` : ''}
          ${params.location ? `location: "${params.location.replace(/"/g, '\\"')}",` : ''}
          ${params.notes ? `description: "${params.notes.replace(/"/g, '\\"')}"` : ''}
        }
        return uid of theEvent
      end tell
    `;

    try {
      const { stdout } = await execAsync(`osascript -e '${script}'`);
      const eventId = stdout.trim();

      return {
        success: true,
        message: `✅ Event "${params.title}" has been added to the calendar.`,
        eventId: eventId || undefined,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to add event to calendar: ${err.message}`,
      };
    }
  }
}
