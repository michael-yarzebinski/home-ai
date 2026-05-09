import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { NoteStore } from "../../stores/note.store";
import { Roles } from "../../../../common/decorators/roles.decorator";
import { Role } from "@home-ai/shared/domain/role/role";
import { ZodValidationPipe } from "../../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";

import { CurrentUser } from "../../../../common/decorators/current-user.decorator";
import type { AuthUser } from "../../../../core/auth/jwt.strategy";

@Controller("v1/admin/notes")
@Roles(Role.ADMIN)
export class NotesAdminController {
  constructor(private readonly noteStore: NoteStore) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.noteStore.search(dto, authUser);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const item = await this.noteStore.getById(id, authUser, true);
    if (!item) throw new NotFoundException(`Note ${id} not found`);
    return item;
  }

  @Post(":id/restore")
  async restore(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    await this.noteStore.restore(id, authUser);
    return this.noteStore.getById(id, authUser, false);
  }
}
