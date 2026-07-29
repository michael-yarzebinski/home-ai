import { Module } from "@nestjs/common";
import { CoreModule } from "src/core/core.module";
import { NoteStore } from "./stores/note.store";
import { NotesController } from "./controllers/notes.controller";
import { NotesAdminController } from "./controllers/admin/notes.admin.controller";
import { AddToNoteTool } from "./tools/add-to-note.tool";
import { DiscoverNotesTool } from "./tools/discover-note.tool";
import { GetNoteTool } from "./tools/get-note.tool";
import { ListNotesTool } from "./tools/list-notes.tool";
import { RegisterNoteTool } from "./tools/register-note.tool";
import { IntegrationsModule } from "../../integrations/integrations.module";

@Module({
  imports: [CoreModule, IntegrationsModule],
  controllers: [NotesAdminController, NotesController],
  providers: [
    NoteStore,
    AddToNoteTool,
    DiscoverNotesTool,
    GetNoteTool,
    ListNotesTool,
    RegisterNoteTool,
  ],
  exports: [
    NoteStore,
    AddToNoteTool,
    DiscoverNotesTool,
    GetNoteTool,
    ListNotesTool,
    RegisterNoteTool,
  ],
})
export class NoteModule {}
