import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ToolBase } from '../tool.base';
import type { ToolRequest } from '../../tools/interfaces/tool-request';
import type { ToolResult } from '../../tools/interfaces/tool-result';
import { AddCalendarEventParams } from 'src/core/tasks/task-parameters';
import { TaskName } from 'src/core/tasks/task-name';
import { RegisterTool } from 'src/core/tools/decorators/register-tool.decorator';
import { ToolRegistryService } from 'src/core/tools/registry/tool-registry.service';

const execAsync = promisify(exec);

@Injectable()
@RegisterTool(TaskName.AddCalendarEvent)
export class AddCalendarEventTool extends ToolBase {
  private readonly logger = new Logger(AddCalendarEventTool.name);

  readonly metadata = {
    taskName: TaskName.AddCalendarEvent,
    description: 'Add a new event to the Family Calendar in Apple Calendar app',
    parameterDto: AddCalendarEventParams,
    hints: ['add event', 'schedule meeting', 'calendar event', 'book appointment'],
    actionType: 'add_calendar_event',
  };

  constructor(protected toolRegistryService: ToolRegistryService) {
    super(toolRegistryService);
  }


  async execute(request: ToolRequest): Promise<ToolResult> {
    const { parameters: params } = request.dispatchRequest;
    const typedParams = params as AddCalendarEventParams;

    const title = typedParams.title || 'New Event';
    const startTime = typedParams.startTime || 'today';
    const duration = typedParams.durationMinutes || 60;
    const notes = typedParams.location || '';

    const cleanTitle = title.replace(/["'`]/g, '');
    const cleanNotes = notes.replace(/["'`]/g, '');

    try {
      const appleScript = `
        tell application "Calendar"
          tell calendar "Family Calendar"
            set theStartDate to date "${startTime}"
            set theEndDate to theStartDate + (${duration} * minutes)
            make new event at end with properties {summary:"${cleanTitle}", start date:theStartDate, end date:theEndDate, description:"${cleanNotes}"}
            return "Added '${cleanTitle}' to calendar."
          end tell
        end tell
      `;

      const { stdout, stderr } = await execAsync(`osascript -e '${appleScript}'`);

      if (stderr) {
        console.error('AppleScript error:', stderr);
        return { success: false, reply: 'Failed to add calendar event.' };
      }

      return {
        success: true,
        reply: stdout.trim() || `Added event "${cleanTitle}" to your calendar.`,
      };
    } catch (error: any) {
      this.logger.error('AddCalendarEventTool error:', error);
      return {
        success: false,
        reply: `Sorry, I couldn’t add the event "${cleanTitle}".`,
      };
    }
  }
}
