import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { TaskHandlerBase, TaskHandlerMetadata } from '../task-handler.base';
import type { TaskHandlerContext } from '../interfaces/task-handler-context';
import { TaskHandlerStatus, type TaskHandlerResult } from '../interfaces/task-handler-result';
import { IsNumber, IsOptional } from 'class-validator';
import { TaskName } from 'src/core/entities/task/task-name';
import { RegisterTask } from 'src/core/task-registry/decorators/register-task.decorator';
import { TaskRegistryService } from 'src/core/task-registry/registry/task-registry.service';

const execAsync = promisify(exec);

export class ReadCalendarParams {
  @IsNumber()
  @IsOptional()
  daysAhead?: number;
}

export const ReadCalendarParamsSchema = `
{
  "type": "object",
  "properties": {
    "daysAhead": { "type": "number", "description": "Optional number of days ahead to check for events" }
  },
  "required": []
}
`;

@Injectable()
@RegisterTask(TaskName.ReadCalendar)
export class ReadCalendarTool extends TaskHandlerBase {
  private readonly logger = new Logger(ReadCalendarTool.name);

  readonly metadata: TaskHandlerMetadata = {
    taskName: TaskName.ReadCalendar,
    description: 'Read upcoming events from the Family Calendar for a given date or period',
    parameters: ReadCalendarParams,
    parametersSchema: ReadCalendarParamsSchema,
    hints: ['what events', 'read calendar', 'show calendar', 'upcoming events', 'whats on my calendar'],
    actionType: 'read_calendar',
  };

  constructor(protected taskRegistryService: TaskRegistryService) {
    super(taskRegistryService);
  }


  async execute(request: TaskHandlerContext): Promise<TaskHandlerResult> {
    const { parameters: params } = request;
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
        status: TaskHandlerStatus.SUCCESS,
        reply: eventsOutput,
        data: { events: eventsOutput, date: dateStr },
      };
    } catch (error: any) {
      this.logger.error('ReadCalendarTool error:', error);
      return {
        status: TaskHandlerStatus.ERROR,
        error: 'Sorry, I couldn’t read the calendar right now.',
      };
    }
  }
}
