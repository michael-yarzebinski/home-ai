import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class CalendarTool {
  /**
   * Add an event to Apple Calendar using AppleScript
   */
  async addEvent(
    parameters: any,
    user: any | null
  ): Promise<{
    success: boolean;
    message: string;
    reply: string;
    notify?: boolean;
  }> {
    const title = parameters.title || parameters.event || 'New Event';
    const startTime = parameters.start_time || parameters.date || 'today';
    const duration = parameters.duration_minutes || 60;
    const notes = parameters.notes || '';

    const cleanTitle = title.replace(/["'`]/g, '');
    const cleanNotes = notes.replace(/["'`]/g, '');

    try {
      const appleScript = `
        tell application "Calendar"
          tell calendar "Family Calendar"
            set newEvent to make new event with properties {summary:"${cleanTitle}", start date:current date, duration:${duration} * minutes}
            if "${cleanNotes}" is not "" then
              set description of newEvent to "${cleanNotes}"
            end if
            return "Event added: ${cleanTitle}"
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
   * Read events from Apple Calendar for a given date (basic implementation)
   */
  async readEvents(
    parameters: any,
    user: any | null
  ): Promise<{
    success: boolean;
    message: string;
    reply: string;
    data?: any;
  }> {
    const dateStr = parameters.date || 'today';

    try {
      const appleScript = `
        tell application "Calendar"
          tell calendar "Family Calendar"
            set theDate to current date
            set eventsList to ""
            repeat with anEvent in (events whose start date is greater than or equal to theDate and start date is less than (theDate + 1 * days))
              set eventsList to eventsList & summary of anEvent & " at " & time string of (start date of anEvent) & return
            end repeat
            return eventsList
          end tell
        end tell
      `;

      const { stdout } = await execAsync(`osascript -e '${appleScript}'`);

      const events = stdout.trim() || "No events found for today.";

      return {
        success: true,
        message: events,
        reply: `Here's what's on the calendar:\n${events}`,
        data: { events },
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