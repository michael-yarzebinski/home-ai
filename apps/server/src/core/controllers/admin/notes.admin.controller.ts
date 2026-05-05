import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  NotFoundException, Param, Post, Put,
} from '@nestjs/common';
import { NoteStore } from '../../stores/note/note.store';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@home-ai/shared/domain/role/role';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { SearchCriteriaSchema, type SearchCriteriaBase } from '@home-ai/shared/search/search';
import {
  InsertableNoteSchema, UpdatableNoteSchema,
  type InsertableNote, type UpdatableNote,
} from '@home-ai/shared/domain/note/note';

@Controller('v1/admin/notes')
@Roles(Role.ADMIN)
export class NotesAdminController {
  constructor(private readonly noteStore: NoteStore) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  search(@Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase) {
    return this.noteStore.search(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const item = await this.noteStore.getById(id, true);
    if (!item) throw new NotFoundException(`Note ${id} not found`);
    return item;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(new ZodValidationPipe(InsertableNoteSchema)) dto: InsertableNote) {
    return this.noteStore.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdatableNoteSchema)) dto: UpdatableNote) {
    return this.noteStore.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param('id') id: string) {
    return this.noteStore.softDelete(id);
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    await this.noteStore.restore(id);
    return this.noteStore.getById(id, true);
  }
}
