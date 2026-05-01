// src/tools/default/add-to-note.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import type { ToolContext } from '../../types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

const AddToNoteToolSchema = z.object({
  name: z
    .string()
    .min(1)
    .describe('Exact `name` from list-notes (notes registered in Home AI), e.g. "Shopping List".'),
  content: z.string().min(1).describe('Content to add to the note.  List items should be separated by newlines.'),
});

export interface AddToNoteResult {
  success: boolean;
  message: string;
}

@Tool()
@Injectable()
export class AddToNoteTool extends ToolHandler<typeof AddToNoteToolSchema, AddToNoteResult> {
  readonly name = 'add-to-note';

  readonly description =
    'Add or append content to an Apple Note registered in Home AI (shopping lists, checklists, etc.). ' +
    'Always call list-notes first and use the exact `name` from that response—do not guess from Apple Notes alone.';

  readonly parameters = AddToNoteToolSchema;

  async execute(
    params: z.infer<typeof AddToNoteToolSchema>,
    context: ToolContext,
  ): Promise<AddToNoteResult> {
    const action = true ? 'appended to' : 'written to';

    const lines = params.content.split('\n').filter(l => l.trim().length > 0);
    const isList = lines.length > 1;

    let script = '';

    if (!isList) {
      // SILENT METHOD: Single lines remain background-only
      script = `
      tell application "Notes"
        set targetNote to first note whose name is "${params.name}"
        set AppleScript's text item delimiters to "</body>"
        set oldBody to body of targetNote
        set body of targetNote to (item 1 of (text items of oldBody)) & "<div>${params.content}</div></body></html>"
      end tell
    `;
    } else {
      // UI METHOD: Precise item-by-item entry
      // We construct a series of keystroke commands for the loop
      const keystrokeCommands = lines
        .map(line => `keystroke "${line.replace(/"/g, '\\"')}"\n          keystroke return`)
        .join('\n          ');

      script = `
      tell application "Notes"
        activate
        show note "${params.name}"
      end tell
      tell application "System Events"
        tell process "Notes"
          try
            click text area 1 of scroll area 3 of splitter group 1 of window 1
          end try
          
          -- Ensure we are at the end of the note
          key code 125 using {command down} 
          keystroke return
          
          -- Activate the checklist mode
          click UI Element 6 of tool bar 1 of window 1
          
          -- Individual Item Entry
          ${keystrokeCommands}
        end tell
      end tell
    `;
    }

    await this.runAppleScript(script);

    return {
      success: true,
      message: `✅ Content has been ${action} note "${params.name}".`,
    };
  }
}
