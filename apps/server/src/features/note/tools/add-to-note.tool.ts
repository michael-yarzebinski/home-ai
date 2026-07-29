import { z } from "zod";
import { ToolHandler } from "../../../tools/abstract/tool-handler";
import type { ToolContext } from "../../../tools/types/tool-context";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";
import { RelayService } from "../../../integrations/relay/relay.service";

const AddToNoteToolSchema = z.object({
  name: z
    .string()
    .min(1)
    .describe(
      'Exact `name` from list-notes (notes registered in Home AI), e.g. "Shopping List".',
    ),
  content: z
    .string()
    .min(1)
    .describe(
      "Content to add to the note.  List items should be separated by newlines.",
    ),
});

export interface AddToNoteResult {
  success: boolean;
  message: string;
}

@Tool()
@Injectable()
export class AddToNoteTool extends ToolHandler<
  typeof AddToNoteToolSchema,
  AddToNoteResult
> {
  readonly name = "add-to-note";

  readonly description =
    "Add or append content to an Apple Note registered in Home AI (shopping lists, checklists, etc.). " +
    "Always call list-notes first and use the exact `name` from that response-do not guess from Apple Notes alone.";

  readonly parameters = AddToNoteToolSchema;

  constructor(private readonly relayService: RelayService) {
    super();
  }

  async execute(
    params: z.infer<typeof AddToNoteToolSchema>,
    _context: ToolContext,
  ): Promise<AddToNoteResult> {
    const action = true ? "appended to" : "written to";

    const lines = params.content.split("\n").filter((l) => l.trim().length > 0);
    const isList = lines.length > 1;

    let script = "";

    if (!isList && !params.name.toLowerCase().includes("list")) {
      script = `
      tell application "Notes"
        set targetNote to first note whose name is "${params.name}"
        set AppleScript's text item delimiters to "</body>"
        set oldBody to body of targetNote
        set body of targetNote to (item 1 of (text items of oldBody)) & "<div>${params.content}</div></body></html>"
      end tell
    `;
    } else {
      const escape = (value: string) =>
        value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

      // Type each item on its own line. We only emit `return` *between* items
      // so we don't leave a trailing empty checklist item at the end.
      const keystrokeCommands = lines
        .map((line) => `keystroke "${escape(line)}"`)
        .join("\n          keystroke return\n          ");

      const noteName = escape(params.name);

      script = `
      tell application "System Events"
        set previousApp to name of first application process whose frontmost is true
      end tell

      tell application "Notes"
        activate
        show note "${noteName}"
      end tell

      tell application "System Events"
        -- Force Notes frontmost and wait until it actually is, so keystrokes
        -- don't leak into whatever app was focused before (UI scripting only
        -- works against the frontmost process).
        tell process "Notes"
          set frontmost to true
          repeat 50 times
            if frontmost then exit repeat
            delay 0.1
          end repeat
        end tell
        delay 0.4

        tell process "Notes"
          -- Place the insertion point inside the note's text area.
          try
            click text area 1 of scroll area 3 of splitter group 1 of window 1
          end try

          -- Jump to the end of the note and start a fresh line.
          key code 125 using {command down}
          keystroke return

          -- "Make Checklist" shortcut: guarantees Apple checklist items
          -- (with checkboxes) rather than bulleted/dashed list items.
          keystroke "l" using {command down, shift down}

          ${keystrokeCommands}
        end tell
      end tell

      -- Restore focus to whatever app was active before we ran.
      try
        tell application "System Events"
          tell application process previousApp to set frontmost to true
        end tell
      end try
    `;
    }

    await this.relayService.runAppleScript(script);

    return {
      success: true,
      message: `✅ Content has been ${action} note "${params.name}".`,
    };
  }
}
