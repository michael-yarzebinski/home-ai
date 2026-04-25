// src/tools/default/list-notes.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import { NoteStore } from '../../../core/stores/note/note.store';
import type { ToolContext } from '../../types/tool-context';
import type { Note } from '@home-ai/shared/domain/note/note';
import { addPermissionFlags } from 'src/common/utils/permissions';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

const ListNotesToolSchema = z.object({});

export interface ListNotesResult {
  notes: Array<
    Note & {
      canRead: boolean;
      canWrite: boolean;
    }
  >;
  total: number;
}

@Tool()
@Injectable()
export class ListNotesTool extends ToolHandler<typeof ListNotesToolSchema, ListNotesResult> {
  readonly name = 'list-notes';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'List all notes and note folders that are registered in the system. ' +
    'This is the recommended first step when the user asks about any note. ' +
    'Always call this tool first unless you already know the exact note name from previous context.';

  readonly parameters = ListNotesToolSchema;

  constructor(private readonly noteStore: NoteStore) {
    super();
  }

  async execute(
    _params: z.infer<typeof ListNotesToolSchema>,
    context: ToolContext,
  ): Promise<ListNotesResult> {
    let notes = await this.noteStore.getAll();

    const availableNotes = addPermissionFlags(notes, context.userRole);

    return {
      notes: availableNotes,
      total: availableNotes.length,
    };
  }
}
