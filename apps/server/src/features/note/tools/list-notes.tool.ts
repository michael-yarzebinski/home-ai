import { z } from "zod";
import { ToolHandler } from "../../../tools/abstract/tool-handler";
import { NoteStore } from "../stores/note.store";
import type { ToolContext } from "../../../tools/types/tool-context";
import type { Note } from "@home-ai/shared/domain/note/note";
import { addPermissionFlags } from "src/common/utils/permissions";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";

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
export class ListNotesTool extends ToolHandler<
  typeof ListNotesToolSchema,
  ListNotesResult
> {
  readonly name = "list-notes";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "List notes registered in Home AI; each row includes canRead/canWrite for this user. " +
    "Call this before get-note or add-to-note unless the exact registered name is already known. " +
    "Use discover-notes only when you need names from the Apple Notes app before registering the note in Home AI.";

  readonly parameters = ListNotesToolSchema;

  constructor(private readonly noteStore: NoteStore) {
    super();
  }

  async execute(
    _params: z.infer<typeof ListNotesToolSchema>,
    context: ToolContext,
  ): Promise<ListNotesResult> {
    const notes = await this.noteStore.getAll();
    const availableNotes = addPermissionFlags(notes, context.userRole);

    return {
      notes: availableNotes,
      total: availableNotes.length,
    };
  }
}
