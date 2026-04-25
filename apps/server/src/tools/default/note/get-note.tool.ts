// src/tools/default/get-note.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ToolContext } from '../../types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

const execAsync = promisify(exec);

const GetNoteToolSchema = z.object({
  name: z
    .string()
    .min(1)
    .describe('Exact name of the registered note to read (e.g. "Shopping List")'),
});

export interface GetNoteResult {
  name: string;
  content: string;
  message: string;
}

@Tool()
@Injectable()
export class GetNoteTool extends ToolHandler<typeof GetNoteToolSchema, GetNoteResult> {
  readonly name = 'get-note';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'Read the full current content of a registered Apple Note. ' +
    'Only use this tool if you already know the exact note name from a previous list-notes call. ' +
    'Do not guess the note name. If unsure, call list-notes first.';

  readonly parameters = GetNoteToolSchema;

  async execute(
    params: z.infer<typeof GetNoteToolSchema>,
    context: ToolContext,
  ): Promise<GetNoteResult> {
    const script = `
      tell application "Notes"
        try
          set targetNote to first note whose name is "${params.name}"
          return body of targetNote
        on error errMsg
          return "ERROR: " & errMsg
        end try
      end tell
    `;

    try {
      const { stdout } = await execAsync(`osascript -e '${script}'`);
      const content = stdout.trim();

      if (content.startsWith('ERROR:')) {
        return {
          name: params.name,
          content: '',
          message: content,
        };
      }

      return {
        name: params.name,
        content: content || '[Empty note]',
        message: `Note "${params.name}" loaded successfully.`,
      };
    } catch (err: any) {
      return {
        name: params.name,
        content: '',
        message: `Failed to read note "${params.name}": ${err.message}`,
      };
    }
  }
}
