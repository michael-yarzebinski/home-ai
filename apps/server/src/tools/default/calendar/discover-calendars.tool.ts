// src/tools/default/discover-calendars.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ToolContext } from '../../types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

const execAsync = promisify(exec);

const DiscoverCalendarsToolSchema = z.object({
  query: z
    .string()
    .optional()
    .describe('Optional search term to filter calendars by name'),
});

export interface DiscoverCalendarsResult {
  calendars: Array<{
    name: string;
    friendlyName: string;
    color?: string;
  }>;
  totalFound: number;
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
    'Discover and list all calendars that exist in the Apple Calendar app. ' +
    'This tool reaches out to the external Calendar app (not just our internal database). ' +
    'Use this tool when the user wants to register a new calendar into the Home AI system.';

  readonly parameters = DiscoverCalendarsToolSchema;

  async execute(
    params: z.infer<typeof DiscoverCalendarsToolSchema>,
    context: ToolContext,
  ): Promise<DiscoverCalendarsResult> {
    const script = `
      tell application "Calendar"
        set theCalendars to every calendar
        set calendarList to {}
        
        repeat with c in theCalendars
          set calendarInfo to {
            name: name of c,
            color: color of c as string
          }
          copy calendarInfo to end of calendarList
        end repeat
        
        return calendarList
      end tell
    `;

    try {
      const { stdout } = await execAsync(`osascript -e '${script}'`);
      let rawCalendars = JSON.parse(stdout.trim() || '[]');

      if (params.query) {
        const term = params.query.toLowerCase();
        rawCalendars = rawCalendars.filter((c: any) => c.name.toLowerCase().includes(term));
      }

      const calendars = rawCalendars.map((c: any) => ({
        name: c.name,
        friendlyName: c.name,
        color: c.color,
      }));

      return {
        calendars,
        totalFound: calendars.length,
        message: `Found ${calendars.length} calendars in Apple Calendar.`,
      };
    } catch (err: any) {
      return {
        calendars: [],
        totalFound: 0,
        message: `Failed to discover calendars from Apple Calendar: ${err.message}`,
      };
    }
  }
}
