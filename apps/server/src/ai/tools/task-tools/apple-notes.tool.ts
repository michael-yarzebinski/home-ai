import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ToolBase } from '../tool.base';
import type { ToolRequest } from '../../tools/interfaces/tool-request';
import type { ToolResult } from '../../tools/interfaces/tool-result';

const execAsync = promisify(exec);

@Injectable()
export class AppleNotesTool extends ToolBase {
  readonly taskNames = ['add_to_grocery_list', 'add_to_short_term_list', 'add_to_long_term_list'] as const;

  canHandle(taskName: string): boolean {
    return this.taskNames.some(name => taskName.startsWith(name));
  }

  /**
   * Add a checkbox item to a specific Apple Note (used by grocery/short/long term tasks).
   * Note: This will be split further in future cleanups for stricter 1:1 mapping.
   * Currently adapts the previous addToNote logic to the new execute signature.
   */
  async execute(request: ToolRequest): Promise<ToolResult> {
    const { parameters: params, task } = request.request;
    const taskName = task.task_name || params.taskName || 'add_to_grocery_list';
    let noteName = task.target || 'Grocery List';
    if (taskName.startsWith('add_to_short_term_list')) noteName = 'Short Term List';
    if (taskName.startsWith('add_to_long_term_list')) noteName = 'Long Term List';

    const item = params.item || params.text || params.items?.[0]?.item || 'New item';
    const cleanItem = item.replace(/["'`]/g, ''); // Basic sanitization

    try {
      // AppleScript to append a checkbox to a specific note
      const appleScript = `
        tell application "Notes"
          set targetNote to first note whose name is "${noteName}"
          set newBody to (body of targetNote) & return & "- [ ] ${cleanItem}"
          set body of targetNote to newBody
          return "Added to ${noteName}: ${cleanItem}"
        end tell
      `;

      const { stdout, stderr } = await execAsync(`osascript -e '${appleScript}'`);

      if (stderr) {
        console.error('AppleScript error:', stderr);
        return {
          success: false,
          message: 'Failed to update Apple Note',
          reply: 'Sorry, I couldn’t update the note. Please try again.',
        };
      }

      const resultMessage = stdout.trim() || `Added "${cleanItem}" to ${noteName}`;

      return {
        success: true,
        message: resultMessage,
        reply: resultMessage,
        notify: true, // Trigger notification to parents/etc.
      };

    } catch (error: any) {
      console.error('Apple Notes error:', error);
      return {
        success: false,
        message: 'AppleScript execution failed',
        reply: `Sorry, I couldn’t add "${cleanItem}" to ${noteName}.`,
      };
    }
  }

}
