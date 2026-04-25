// src/tools/default/update-calendar-event.tool.ts
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ToolHandler } from 'src/tools/abstract/tool-handler';
import { ToolContext } from 'src/tools/types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

const execAsync = promisify(exec);

const UpdateCalendarEventToolSchema = z.object({
  eventId: z
    .string()
    .min(1)
    .describe('The unique event ID (UID) from Apple Calendar for the event to update'),

  title: z.string().optional().describe('New title for the event'),

  startDate: z.string().optional().describe('New start date in YYYY-MM-DD format'),

  startTime: z.string().optional().describe('New start time in HH:MM format'),

  endDate: z.string().optional().describe('New end date in YYYY-MM-DD format'),

  endTime: z.string().optional().describe('New end time in HH:MM format'),

  location: z.string().optional().describe('New location'),

  notes: z.string().optional().describe('New notes/description'),
});

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
    'Update an existing event in Apple Calendar. ' +
    'Use this tool when the user wants to modify a previously created event.';

  readonly parameters = UpdateCalendarEventToolSchema;

  async execute(
    params: z.infer<typeof UpdateCalendarEventToolSchema>,
    context: ToolContext,
  ): Promise<UpdateCalendarEventResult> {
    const scriptParts = [`tell application "Calendar"`];

    if (params.title) scriptParts.push(`set summary of theEvent to "${params.title.replace(/"/g, '\\"')}"`);
    if (params.startDate) scriptParts.push(`set start date of theEvent to date "${params.startDate}"`);
    if (params.startTime)
      scriptParts.push(`set start date of theEvent to date "${params.startDate} ${params.startTime}"`);
    if (params.endDate) scriptParts.push(`set end date of theEvent to date "${params.endDate}"`);
    if (params.endTime)
      scriptParts.push(`set end date of theEvent to date "${params.endDate} ${params.endTime}"`);
    if (params.location)
      scriptParts.push(`set location of theEvent to "${params.location.replace(/"/g, '\\"')}"`);
    if (params.notes)
      scriptParts.push(`set description of theEvent to "${params.notes.replace(/"/g, '\\"')}"`);

    scriptParts.push(`
      end tell
    `);

    const script = scriptParts.join('\n');

    try {
      await execAsync(`osascript -e '${script}'`);

      return {
        success: true,
        message: `✅ Event has been updated successfully.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to update event: ${err.message}`,
      };
    }
  }
}
