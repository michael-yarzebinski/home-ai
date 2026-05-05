import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  NotFoundException, Param, Post, Put,
} from '@nestjs/common';
import { FactsStore } from '../../../features/facts/stores/facts.store';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@home-ai/shared/domain/role/role';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { SearchCriteriaSchema, type SearchCriteriaBase } from '@home-ai/shared/search/search';
import {
  InsertableFactSchema, UpdatableFactSchema,
  type InsertableFact, type UpdatableFact,
} from '@home-ai/shared/domain/fact/fact';

@Controller('v1/admin/facts')
@Roles(Role.ADMIN)
export class FactsAdminController {
  constructor(private readonly factsStore: FactsStore) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  search(@Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase) {
    return this.factsStore.search(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const item = await this.factsStore.getById(id, true);
    if (!item) throw new NotFoundException(`Fact ${id} not found`);
    return item;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(new ZodValidationPipe(InsertableFactSchema)) dto: InsertableFact) {
    return this.factsStore.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdatableFactSchema)) dto: UpdatableFact) {
    return this.factsStore.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param('id') id: string) {
    return this.factsStore.softDelete(id);
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    await this.factsStore.restore(id);
    return this.factsStore.getById(id, true);
  }
}
