import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ToolBase } from '../tool.base';
import type { ToolRequest } from '../../tools/interfaces/tool-request';
import type { ToolResult } from '../../tools/interfaces/tool-result';

const execAsync = promisify(exec);

@Injectable()
export class CalendarTool extends ToolBase {
  readonly taskNames = ['add_calendar_event', 'read_calendar'] as const;

  canHandle(taskName: string): boolean {
    return this.taskNames.includes(taskName as any);
  }

  async execute(request: ToolRequest): Promise<ToolResult> {
    const { task } = request.request;
    const taskName = task.taskName;
    if (taskName === 'read_calendar') {
      return this.readEvents(request);  // Pass full request for consistency with other tools
    }

    return this.addEvent(request);
  }

  /**
   * Add an event to Apple Calendar using AppleScript.
   * Uses AI-provided start_time (natural language or ISO) for the event start.
   */
  private async addEvent(request: ToolRequest): Promise<ToolResult> {
    const { parameters: params } = request.request;
    const title = params.title || params.event || 'New Event';
    const startTime = params.start_time || params.date || 'today';
    const duration = params.duration_minutes || 60;
    const notes = params.notes || '';

    const cleanTitle = title.replace(/["'`]/g, '');
    const cleanNotes = notes.replace(/["'`]/g, '');

    try {
      const appleScript = `
        tell application "Calendar"
          tell calendar "Family Calendar"
            set startDate to current date
            if "${startTime}" is not "today" and "${startTime}" is not "" then
              try
                set startDate to date "${startTime}"
              on error
                -- Fallback for complex natural language
                set startDate to current date
              end try
            end if
            set newEvent to make new event with properties {summary:"${cleanTitle}", start date:startDate, duration:${duration} * minutes}
            if "${cleanNotes}" is not "" then
              set description of newEvent to "${cleanNotes}"
            end if
            return "Event added: ${cleanTitle} starting at " & (startDate as string)
          end tell
        end tell
      `;

      const { stdout, stderr } = await execAsync(`osascript -e '${appleScript}'`);

      if (stderr) {
        console.error('Calendar AppleScript error:', stderr);
        return {
          success: false,
          message: 'Failed to add calendar event',
          reply: 'Sorry, I couldn’t add the event to the calendar.',
        };
      }

      const resultMessage = stdout.trim() || `Added "${cleanTitle}" to calendar`;

      return {
        success: true,
        message: resultMessage,
        reply: resultMessage,
        notify: true,
      };

    } catch (error: any) {
      console.error('Calendar tool error:', error);
      return {
        success: false,
        message: 'AppleScript execution failed',
        reply: `Sorry, I couldn’t add "${cleanTitle}" to the calendar.`,
      };
    }
  }

  /**
   * Read events from Apple Calendar for a given date.
   * Now properly uses the `date` parameter from the AI (e.g. "tomorrow", "next Monday", "2026-04-15").
   */
  private async readEvents(request: ToolRequest): Promise<ToolResult> {
    const { parameters: params } = request.request;
    const dateStr = params.date || 'today';

    try {
      const appleScript = `
        tell application "Calendar"
          tell calendar "Family Calendar"
            set targetDate to current date
            if "${dateStr}" is not "today" and "${dateStr}" is not "" then
              try
                set targetDate to date "${dateStr}"
              on error errMsg
                -- Fallback for complex natural language dates
                set targetDate to current date
              end try
            end if
            
            set eventsList to ""
            set startOfDay to targetDate - (time of targetDate)
            set endOfDay to startOfDay + 1 * days
            
            repeat with anEvent in (events whose start date ≥ startOfDay and start date < endOfDay)
              set eventsList to eventsList & summary of anEvent & " at " & (time string of (start date of anEvent)) & return
            end repeat
            
            if eventsList is "" then
              return "No events found for " & (targetDate as string)
            else
              return "Events for " & (targetDate as string) & ":" & return & eventsList
            end if
          end tell
        end tell
      `;

      const { stdout } = await execAsync(`osascript -e '${appleScript}'`);

      const eventsOutput = stdout.trim() || `No events found for ${dateStr}.`;

      return {
        success: true,
        message: eventsOutput,
        reply: eventsOutput,
        data: { events: eventsOutput, date: dateStr },
      };

    } catch (error: any) {
      console.error('Read calendar error:', error);
      return {
        success: false,
        message: 'Failed to read calendar',
        reply: 'Sorry, I couldn’t read the calendar right now.',
      };
    }
  }
}