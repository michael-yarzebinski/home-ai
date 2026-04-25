// src/tools/default/discover-notes.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ToolContext } from '../../types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

const execAsync = promisify(exec);

const DiscoverNotesToolSchema = z.object({
  query: z
    .string()
    .optional()
    .describe('Optional search term to filter notes by name'),
});

export interface DiscoverNotesResult {
  notes: Array<{
    name: string;
    friendlyName?: string;
  }>;
  totalFound: number;
  message: string;
}

@Tool()
@Injectable()
export class DiscoverNotesTool extends ToolHandler<typeof DiscoverNotesToolSchema, DiscoverNotesResult> {
  readonly name = 'discover-notes';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'Discover and list all notes and note folders that exist in the Apple Notes app. ' +
    'This tool reaches out to the external Notes app (not just our internal database). ' +
    'Use this tool when the user wants to register a new note or folder into the Home AI system.';

  readonly parameters = DiscoverNotesToolSchema;

  async execute(
    params: z.infer<typeof DiscoverNotesToolSchema>,
    context: ToolContext,
  ): Promise<DiscoverNotesResult> {
    const script = `
      tell application "Notes"
        set theNotes to every note
        set noteList to {}
        
        repeat with n in theNotes
          set noteInfo to {
            name: name of n
          }
          copy noteInfo to end of noteList
        end repeat
        
        return noteList
      end tell
    `;

    try {
      const { stdout } = await execAsync(`osascript -e '${script}'`);
      let rawNotes = JSON.parse(stdout.trim() || '[]');

      if (params.query) {
        const term = params.query.toLowerCase();
        rawNotes = rawNotes.filter((n: any) => n.name.toLowerCase().includes(term));
      }

      const notes = rawNotes.map((n: any) => ({
        name: n.name,
        friendlyName: n.name,
      }));

      return {
        notes,
        totalFound: notes.length,
        message: `Found ${notes.length} notes in Apple Notes.`,
      };
    } catch (err: any) {
      return {
        notes: [],
        totalFound: 0,
        message: `Failed to discover notes from Apple Notes: ${err.message}`,
      };
    }
  }
}
