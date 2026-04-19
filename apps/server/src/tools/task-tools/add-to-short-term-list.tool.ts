import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { TaskHandlerBase, TaskHandlerMetadata } from '../task-handler.base';
import type { TaskHandlerContext } from '../interfaces/task-handler-context';
import { TaskHandlerStatus, type TaskHandlerResult } from '../interfaces/task-handler-result';
import { IsArray, IsDefined, IsString } from 'class-validator';
import { TaskName } from 'src/core/entities/task/task-name';
import { RegisterTask } from 'src/core/task-registry/decorators/register-task.decorator';
import { TaskRegistryService } from 'src/core/task-registry/registry/task-registry.service';

const execAsync = promisify(exec);

export class AddToShortTermListParams {
  @IsArray()
  @IsString({ each: true })
  @IsDefined()
  items: string[];
}

export const AddToShortTermListParamsSchema = `
{
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "description": "List of checklist items to add to the short-term list",
      "items": { "type": "string", "description": "A short-term list entry" }
    }
  },
  "required": ["items"]
}
`;

@Injectable()
@RegisterTask(TaskName.AddToShortTermList)
export class AddToShortTermListTool extends TaskHandlerBase {
  private readonly logger = new Logger(AddToShortTermListTool.name);

  readonly metadata: TaskHandlerMetadata = {
    taskName: TaskName.AddToShortTermList,
    description: 'Add one or more items to the short term list note in Apple Notes',
    parameters: AddToShortTermListParams,
    parametersSchema: AddToShortTermListParamsSchema,
    hints: ['add to short term', 'short term list', 'remind me to', 'add to short-term'],
    actionType: 'add_to_short_term_list',
  };

  constructor(protected taskRegistryService: TaskRegistryService) {
    super(taskRegistryService);
  }


  async execute(request: TaskHandlerContext): Promise<TaskHandlerResult> {
    const { parameters: params } = request;
    const typedParams = params as AddToShortTermListParams;

    const items = typedParams.items || [];
    if (items.length === 0) {
      return {
        status:  TaskHandlerStatus.CLARIFICATION_NEEDED,
        reply: 'No items provided to add to short term list.',
      };
    }

    const itemList = items.join(', ');

      const appleScript = `
        tell application "Notes"
          set targetNote to first note whose name is "Short Term List"
          set newBody to (body of targetNote) & return & "- [ ] ${itemList.replace(/["'`]/g, '')}"
          set body of targetNote to newBody
          return "Added to Short Term List: ${itemList}"
        end tell
      `;

      const { stdout, stderr } = await execAsync(`osascript -e '${appleScript}'`);

      if (stderr) {
        console.error('AppleScript error:', stderr);
        return { status: TaskHandlerStatus.ERROR, error: 'Failed to update short term list.' };
      }

      return {
        status:  TaskHandlerStatus.SUCCESS, reply: stdout.trim() || `Added ${items.length} item(s) to Short Term List.`,
      };

  }
}
