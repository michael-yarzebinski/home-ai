import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ToolBase } from '../tool.base';
import type { ToolRequest } from '../../tools/interfaces/tool-request';
import type { ToolResult } from '../../tools/interfaces/tool-result';
import { AddToLongTermListParams } from 'src/core/tasks/task-parameters';
import { TaskName } from 'src/core/tasks/task-name';
import { RegisterTool } from 'src/core/tools/decorators/register-tool.decorator';
import { ToolRegistryService } from 'src/core/tools/registry/tool-registry.service';

const execAsync = promisify(exec);

@Injectable()
@RegisterTool(TaskName.AddToLongTermList)
export class AddToLongTermListTool extends ToolBase {
  private readonly logger = new Logger(AddToLongTermListTool.name);

  readonly metadata = {
    taskName: TaskName.AddToLongTermList,
    description: 'Add one or more items to the long term list note in Apple Notes',
    parameterDto: AddToLongTermListParams,
    hints: ['add to long term', 'long term list', 'add to long-term', 'remember for later'],
    actionType: 'add_to_long_term_list',
  };

  constructor(protected toolRegistryService: ToolRegistryService) {
    super(toolRegistryService);
  }


  async execute(request: ToolRequest): Promise<ToolResult> {
    const { parameters: params } = request.dispatchRequest;
    const typedParams = params as AddToLongTermListParams;

    const items = typedParams.items || [];
    if (items.length === 0) {
      return {
        success: false,
        reply: 'No items provided to add to long term list.',
      };
    }

    const itemList = items.join(', ');

    try {
      const appleScript = `
        tell application "Notes"
          set targetNote to first note whose name is "Long Term List"
          set newBody to (body of targetNote) & return & "- [ ] ${itemList.replace(/["'`]/g, '')}"
          set body of targetNote to newBody
          return "Added to Long Term List: ${itemList}"
        end tell
      `;

      const { stdout, stderr } = await execAsync(`osascript -e '${appleScript}'`);

      if (stderr) {
        console.error('AppleScript error:', stderr);
        return { success: false, reply: 'Failed to update long term list.' };
      }

      return {
        success: true,
        reply: stdout.trim() || `Added ${items.length} item(s) to Long Term List.`,
      };
    } catch (error: any) {
      this.logger.error('AddToLongTermListTool error:', error);
      return {
        success: false,
        reply: 'Sorry, I couldn’t add the items to your long term list.',
      };
    }
  }
}
