// src/tools/default/add-to-note.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ToolContext } from '../../types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

const execAsync = promisify(exec);

const AddToNoteToolSchema = z.object({
  name: z.string().min(1).describe('Name of the registered note (e.g. "Shopping List")'),
  content: z.string().min(1).describe('Content to add to the note'),
  append: z
    .boolean()
    .default(true)
    .describe('If true, append to the existing note. If false, replace the entire content.'),
});

export interface AddToNoteResult {
  success: boolean;
  message: string;
}

@Tool()
@Injectable()
export class AddToNoteTool extends ToolHandler<typeof AddToNoteToolSchema, AddToNoteResult> {
  readonly name = 'add-to-note';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'Add or append content to a registered Apple Note. ' +
    'Use this tool for shopping lists, checklists, or updating any note content.';

  readonly parameters = AddToNoteToolSchema;

  async execute(
    params: z.infer<typeof AddToNoteToolSchema>,
    context: ToolContext,
  ): Promise<AddToNoteResult> {
    const action = params.append ? 'appended to' : 'written to';

    const script = `
      tell application "Notes"
        set targetNote to first note whose name is "${params.name}"
        
        if ${params.append} then
          set currentBody to body of targetNote
          set body of targetNote to currentBody & "\n\n${params.content.replace(/"/g, '\\"')}"
        else
          set body of targetNote to "${params.content.replace(/"/g, '\\"')}"
        end if
      end tell
    `;

    try {
      await execAsync(`osascript -e '${script}'`);

      return {
        success: true,
        message: `✅ Content has been ${action} note "${params.name}".`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to update note "${params.name}": ${err.message}`,
      };
    }
  }
}
