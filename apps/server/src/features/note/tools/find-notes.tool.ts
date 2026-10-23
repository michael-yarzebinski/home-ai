import { z } from "zod";
import { ToolHandler } from "../../../tools/abstract/tool-handler";
import { NoteStore } from "../stores/note.store";
import type { ToolContext } from "../../../tools/types/tool-context";
import type { Note } from "@home-ai/shared/domain/note/note";
import { addPermissionFlags } from "src/common/utils/permissions";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";
import { fuzzyFind } from "src/tools/utils/fuzzy-find.utils";

const FindNotesToolSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      'Natural-language or partial note name (e.g. "grocery list"). ' +
        "Matched against registered name and friendlyName; typos are OK.",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(25)
    .optional()
    .describe("Max matches to return (default 10)."),
});

export interface FindNotesResult {
  notes: Array<
    Note & {
      canRead: boolean;
      canWrite: boolean;
      score: number;
    }
  >;
  total: number;
  query: string;
}

@Tool()
@Injectable()
export class FindNotesTool extends ToolHandler<
  typeof FindNotesToolSchema,
  FindNotesResult
> {
  readonly name = "find-notes";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "Fuzzy-search notes registered in Home AI by name and friendlyName. " +
    "Prefer this over list-notes when resolving a user phrase to a note name. " +
    "If 0 or many matches, ask for clarification or call list-notes. " +
    "Never invent note names — only use names returned here or from list-notes.";

  readonly parameters = FindNotesToolSchema;

  constructor(private readonly noteStore: NoteStore) {
    super();
  }

  async execute(
    params: z.infer<typeof FindNotesToolSchema>,
    context: ToolContext,
  ): Promise<FindNotesResult> {
    const notes = await this.noteStore.getAll(context.authUser);
    const available = addPermissionFlags(notes, context.authUser.role);
    const matches = fuzzyFind(
      available,
      params.query,
      (n) => [n.name, n.friendlyName],
      { limit: params.limit },
    );

    return {
      notes: matches,
      total: matches.length,
      query: params.query,
    };
  }
}
