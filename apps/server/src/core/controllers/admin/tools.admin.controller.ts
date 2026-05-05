import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  NotFoundException, Param, Post, Put,
} from '@nestjs/common';
import { ToolStore } from '../../stores/tool/tool.store';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@home-ai/shared/domain/role/role';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { SearchCriteriaSchema, type SearchCriteriaBase } from '@home-ai/shared/search/search';
import {
  InsertableToolSchema, UpdatableToolSchema,
  type InsertableTool, type UpdatableTool,
} from '@home-ai/shared/domain/tool/tool';

@Controller('v1/admin/tools')
@Roles(Role.ADMIN)
export class ToolsAdminController {
  constructor(private readonly toolStore: ToolStore) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  search(@Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase) {
    return this.toolStore.search(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const item = await this.toolStore.getById(id, true);
    if (!item) throw new NotFoundException(`Tool ${id} not found`);
    return item;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(new ZodValidationPipe(InsertableToolSchema)) dto: InsertableTool) {
    return this.toolStore.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdatableToolSchema)) dto: UpdatableTool) {
    return this.toolStore.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param('id') id: string) {
    return this.toolStore.softDelete(id);
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    await this.toolStore.restore(id);
    return this.toolStore.getById(id, true);
  }
}
