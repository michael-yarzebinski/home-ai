import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { TaskHandlerBase, TaskHandlerMetadata } from '../task-handler.base';
import type { TaskHandlerContext } from '../interfaces/task-handler-context';
import { TaskHandlerStatus, type TaskHandlerResult } from '../interfaces/task-handler-result';
import { IsArray, IsDefined, IsNumber, IsOptional, IsString } from 'class-validator';
import { TaskName } from 'src/core/entities/task/task-name';
import { RegisterTask } from 'src/core/task-registry/decorators/register-task.decorator';
import { TaskRegistryService } from 'src/core/task-registry/registry/task-registry.service';

const execAsync = promisify(exec);

export class AddCalendarEventParams {
  @IsString()
  @IsDefined()
  title: string;

  @IsString()
  @IsDefined()
  startTime: string;

  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attendees?: string[];
}

export const AddCalendarEventParamsSchema = `
{
  "type": "object",
  "properties": {
    "title": { "type": "string", "description": "Title of the calendar event" },
    "startTime": { "type": "string", "description": "Start time in natural language or ISO format" },
    "durationMinutes": { "type": "number", "description": "Optional event duration in minutes" },
    "location": { "type": "string", "description": "Optional location for the event" },
    "attendees": {
      "type": "array",
      "description": "Optional list of attendee names",
      "items": { "type": "string", "description": "Attendee name" }
    }
  },
  "required": ["title", "startTime"]
}
`;

@Injectable()
@RegisterTask(TaskName.AddCalendarEvent)
export class AddCalendarEventTool extends TaskHandlerBase {
  private readonly logger = new Logger(AddCalendarEventTool.name);

  readonly metadata: TaskHandlerMetadata = {
    taskName: TaskName.AddCalendarEvent,
    description: 'Add a new event to the Family Calendar in Apple Calendar app',
    parameters: AddCalendarEventParams,
    parametersSchema: AddCalendarEventParamsSchema,
    hints: ['add event', 'schedule meeting', 'calendar event', 'book appointment'],
    actionType: 'add_calendar_event',
  };

  constructor(protected taskRegistryService: TaskRegistryService) {
    super(taskRegistryService);
  }


  async execute(request: TaskHandlerContext): Promise<TaskHandlerResult> {
    const { parameters: params } = request;
    const typedParams = params as AddCalendarEventParams;

    const title = typedParams.title || 'New Event';
    const startTime = typedParams.startTime || 'today';
    const duration = typedParams.durationMinutes || 60;
    const notes = typedParams.location || '';

    const cleanTitle = title.replace(/["'`]/g, '');
    const cleanNotes = notes.replace(/["'`]/g, '');

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
      return { status:  TaskHandlerStatus.ERROR, error: 'Failed to add calendar event.' };
    }

    return {
      status:  TaskHandlerStatus.SUCCESS,
      reply: stdout.trim() || `Added event "${cleanTitle}" to your calendar.`,
    };
  }
}
