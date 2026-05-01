// src/tools/default/discover-notes.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import type { ToolContext } from '../../types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';
import { ToolUtils } from 'src/tools/utils/tool.utils';

const DiscoverNotesToolSchema = z.object({
  query: z
    .string()
    .optional()
    .describe('Optional search term to filter notes by name'),
});

const DiscoverNoteItemSchema = z.object({
  name: z.string().min(1),
  id: z.string().min(1),
});

export interface DiscoverNotesResult {
  notes: z.infer<typeof DiscoverNoteItemSchema>[];
  total: number;
  message: string;
}

@Tool()
@Injectable()
export class DiscoverNotesTool extends ToolHandler<typeof DiscoverNotesToolSchema, DiscoverNotesResult> {
  readonly name = 'discover-notes';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'Discover notes in the Apple Notes app (external), for example before register-note in Home AI. ' +
    'For notes already registered in Home AI, prefer list-notes (permission-filtered).';

  readonly parameters = DiscoverNotesToolSchema;

  async execute(
    params: z.infer<typeof DiscoverNotesToolSchema>,
    context: ToolContext,
  ): Promise<DiscoverNotesResult> {
    const script = `
      tell application "Notes"
        set noteNames to name of every note
        set noteIDs to id of every note

        set noteOutput to "["
        repeat with i from 1 to count of noteNames
          if i > 1 then set noteOutput to noteOutput & ","
          set noteOutput to noteOutput & "{\\"name\\":\\"" & (item i of noteNames) & "\\",\\"id\\":\\"" & (item i of noteIDs) & "\\"}"
        end repeat
        set noteOutput to noteOutput & "]"

        return noteOutput
      end tell
    `.trim();

    const result = await this.runAppleScript(script);
    let notes = ToolUtils.parseArray(result, DiscoverNoteItemSchema);
    if (params.query) {
      const term = params.query.toLowerCase();
      notes = notes.filter((n) => n.name.toLowerCase().includes(term));
    }

    return {
      notes,
      total: notes.length,
      message: `Found ${notes.length} notes.`,
    };
  }
}
