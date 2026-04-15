import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ToolBase } from '../tool.base';
import type { ToolRequest } from '../../tools/interfaces/tool-request';
import type { ToolResult } from '../../tools/interfaces/tool-result';
import { AddToGroceryListParams } from 'src/core/tasks/task-parameters';
import { TaskName } from 'src/core/tasks/task-name';
import { RegisterTool } from 'src/core/tools/decorators/register-tool.decorator';
import { ToolRegistryService } from 'src/core/tools/registry/tool-registry.service';

const execAsync = promisify(exec);

@Injectable()
@RegisterTool(TaskName.AddToGroceryList)
export class AddToGroceryListTool extends ToolBase {
  private readonly logger = new Logger(AddToGroceryListTool.name);

  readonly metadata = {
    taskName: TaskName.AddToGroceryList,
    description: 'Add one or more items to the grocery list note in Apple Notes',
    parameterDto: AddToGroceryListParams,
    hints: ['add to grocery', 'grocery list', 'buy milk', 'add groceries'],
    actionType: 'add_to_grocery_list',
  };

  constructor(protected toolRegistryService: ToolRegistryService) {
    super(toolRegistryService);
  }


  async execute(request: ToolRequest): Promise<ToolResult> {
    const { parameters: params } = request.dispatchRequest;
    const typedParams = params as AddToGroceryListParams;

    const items = typedParams.items || [];
    if (items.length === 0) {
      return {
        success: false,
        reply: 'No items provided to add to grocery list.',
      };
    }

    const itemTexts = items
      .map((i) => `${i.item}${i.quantity ? ` (${i.quantity})` : ''}`)
      .join(', ');

    try {
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
        return { success: false, reply: 'Failed to update grocery list.' };
      }

      return {
        success: true,
        reply: stdout.trim() || `Added ${items.length} item(s) to Grocery List.`,
      };
    } catch (error: any) {
      this.logger.error('AddToGroceryListTool error:', error);
      return {
        success: false,
        reply: 'Sorry, I couldn’t add the items to your grocery list.',
      };
    }
  }
}
