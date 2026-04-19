import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { TaskHandlerBase, TaskHandlerMetadata } from '../task-handler.base';
import type { TaskHandlerContext } from '../interfaces/task-handler-context';
import { TaskHandlerStatus, type TaskHandlerResult } from '../interfaces/task-handler-result';
import { IsArray, IsDefined, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskName } from 'src/core/entities/task/task-name';
import { RegisterTask } from 'src/core/task-registry/decorators/register-task.decorator';
import { TaskRegistryService } from 'src/core/task-registry/registry/task-registry.service';

const execAsync = promisify(exec);

export class GroceryItem {
  @IsString()
  @IsDefined()
  item: string;

  @IsString()
  @IsOptional()
  quantity?: string;
}

export const GroceryItemSchema = `
{
  "type": "object",
  "properties": {
    "item": { "type": "string", "description": "Name of the grocery item to add" },
    "quantity": { "type": "string", "description": "Optional quantity for the grocery item" }
  },
  "required": ["item"]
}
`;

export class AddToGroceryListParams {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroceryItem)
  @IsDefined()
  items: GroceryItem[];
}

export const AddToGroceryListParamsSchema = `
{
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "description": "List of items to add to the grocery list",
      "items": ${GroceryItemSchema.trim()}
    }
  },
  "required": ["items"]
}
`;

@Injectable()
@RegisterTask(TaskName.AddToGroceryList)
export class AddToGroceryListTool extends TaskHandlerBase {
  private readonly logger = new Logger(AddToGroceryListTool.name);

  readonly metadata: TaskHandlerMetadata = {
    taskName: TaskName.AddToGroceryList,
    description: 'Add one or more items to the grocery list note in Apple Notes',
    parameters: AddToGroceryListParams,
    parametersSchema: AddToGroceryListParamsSchema,
    hints: ['add to grocery', 'grocery list', 'buy milk', 'add groceries'],
    actionType: 'add_to_grocery_list',
  };

  constructor(protected taskRegistryService: TaskRegistryService) {
    super(taskRegistryService);
  }


  async execute(request: TaskHandlerContext): Promise<TaskHandlerResult> {
    const { parameters: params } = request;
    const typedParams = params as AddToGroceryListParams;

    const items = typedParams.items || [];
    if (items.length === 0) {
      return {
        status: TaskHandlerStatus.CLARIFICATION_NEEDED,
        reply: 'No items provided to add to grocery list.',
      };
    }

    const itemTexts = items
      .map((i) => `${i.item}${i.quantity ? ` (${i.quantity})` : ''}`)
      .join(', ');

    const appleScript = `
        tell application "Notes"
          set targetNote to first note whose name is "Grocery List"
          set newBody to (body of targetNote) & return & "- [ ] ${itemTexts.replace(/["'`]/g, '')}"
          set body of targetNote to newBody
          return "Added to Grocery List: ${itemTexts}"
        end tell
      `;

    const { stdout, stderr } = await execAsync(`osascript -e '${appleScript}'`);

    if (stderr) {
      console.error('AppleScript error:', stderr);
      return { status:  TaskHandlerStatus.ERROR, error: 'Failed to update grocery list.' };
    }

    return {
      status: TaskHandlerStatus.SUCCESS, reply: stdout.trim() || `Added ${items.length} item(s) to Grocery List.`,
    };

  }
}
