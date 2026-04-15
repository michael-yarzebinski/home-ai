import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ToolBase } from '../tool.base';
import type { ToolRequest } from '../../tools/interfaces/tool-request';
import type { ToolResult } from '../../tools/interfaces/tool-result';
import { AddToShortTermListParams } from 'src/core/tasks/task-parameters';
import { TaskName } from 'src/core/tasks/task-name';
import { RegisterTool } from 'src/core/tools/decorators/register-tool.decorator';
import { ToolRegistryService } from 'src/core/tools/registry/tool-registry.service';

const execAsync = promisify(exec);

@Injectable()
@RegisterTool(TaskName.AddToShortTermList)
export class AddToShortTermListTool extends ToolBase {
  private readonly logger = new Logger(AddToShortTermListTool.name);

  readonly metadata = {
    taskName: TaskName.AddToShortTermList,
    description: 'Add one or more items to the short term list note in Apple Notes',
    parameterDto: AddToShortTermListParams,
    hints: ['add to short term', 'short term list', 'remind me to', 'add to short-term'],
    actionType: 'add_to_short_term_list',
  };

  constructor(protected toolRegistryService: ToolRegistryService) {
    super(toolRegistryService);
  }


  async execute(request: ToolRequest): Promise<ToolResult> {
    const { parameters: params } = request.dispatchRequest;
    const typedParams = params as AddToShortTermListParams;

    const items = typedParams.items || [];
    if (items.length === 0) {
      return {
        success: false,
        reply: 'No items provided to add to short term list.',
      };
    }

    const itemList = items.join(', ');

    try {
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
        return { success: false, reply: 'Failed to update short term list.' };
      }

      return {
        success: true,
        reply: stdout.trim() || `Added ${items.length} item(s) to Short Term List.`,
      };
    } catch (error: any) {
      this.logger.error('AddToShortTermListTool error:', error);
      return {
        success: false,
        reply: 'Sorry, I couldn’t add the items to your short term list.',
      };
    }
  }
}
