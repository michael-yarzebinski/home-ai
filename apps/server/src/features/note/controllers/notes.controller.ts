import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { NoteStore } from "../stores/note.store";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import {
  UpdatableNoteSchema,
  type UpdatableNote,
} from "@home-ai/shared/domain/note/note";
import type { AuthUser } from "../../../core/auth/jwt.strategy";

@Controller("v1/notes")
export class NotesController {
  constructor(private readonly noteStore: NoteStore) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.noteStore.search({ ...dto, includeInactive: false }, authUser);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const item = await this.noteStore.getById(id, authUser, false);
    if (!item) throw new NotFoundException(`Note ${id} not found`);
    return item;
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatableNoteSchema)) dto: UpdatableNote,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.noteStore.update(id, dto, authUser);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    return this.noteStore.softDelete(id, authUser);
  }
}
