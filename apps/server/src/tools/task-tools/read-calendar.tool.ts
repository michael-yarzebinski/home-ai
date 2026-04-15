import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ToolBase } from '../tool.base';
import type { ToolRequest } from '../../tools/interfaces/tool-request';
import type { ToolResult } from '../../tools/interfaces/tool-result';
import { ReadCalendarParams } from 'src/core/tasks/task-parameters';
import { TaskName } from 'src/core/tasks/task-name';
import { RegisterTool } from 'src/core/tools/decorators/register-tool.decorator';
import { ToolRegistryService } from 'src/core/tools/registry/tool-registry.service';

const execAsync = promisify(exec);

@Injectable()
@RegisterTool(TaskName.ReadCalendar)
export class ReadCalendarTool extends ToolBase {
  private readonly logger = new Logger(ReadCalendarTool.name);

  readonly metadata = {
    taskName: TaskName.ReadCalendar,
    description: 'Read upcoming events from the Family Calendar for a given date or period',
    parameterDto: ReadCalendarParams,
    hints: ['what events', 'read calendar', 'show calendar', 'upcoming events', 'whats on my calendar'],
    actionType: 'read_calendar',
  };

  constructor(protected toolRegistryService: ToolRegistryService) {
    super(toolRegistryService);
  }


  async execute(request: ToolRequest): Promise<ToolResult> {
    const { parameters: params } = request.dispatchRequest;
    const typedParams = params as ReadCalendarParams;
    const dateStr = typedParams.daysAhead !== undefined ? `in ${typedParams.daysAhead} days` : 'today';

    try {
      const appleScript = `
        tell application "Calendar"
          tell calendar "Family Calendar"
            set targetDate to current date
            if "${dateStr}" is not "today" then
              set targetDate to targetDate + (${typedParams.daysAhead || 0} * days)
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
        reply: eventsOutput,
        data: { events: eventsOutput, date: dateStr },
      };
    } catch (error: any) {
      this.logger.error('ReadCalendarTool error:', error);
      return {
        success: false,
        reply: 'Sorry, I couldn’t read the calendar right now.',
      };
    }
  }
}
