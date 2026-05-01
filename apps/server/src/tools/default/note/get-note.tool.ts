// src/tools/default/get-note.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import type { ToolContext } from '../../types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

const GetNoteToolSchema = z.object({
  name: z
    .string()
    .min(1)
    .describe('Exact `name` from list-notes (notes registered in Home AI). Do not guess.'),
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
    'Read the full content of an Apple Note that is registered in Home AI. Call list-notes first unless the exact `name` is already known.';

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

    const result = await this.runAppleScript(script);
    const content = result.trim();

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
  }
}
