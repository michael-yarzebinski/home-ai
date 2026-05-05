import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, Post } from '@nestjs/common';
import { LogStore } from '../../stores/log/log.store';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@home-ai/shared/domain/role/role';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { SearchCriteriaSchema, type SearchCriteriaBase } from '@home-ai/shared/search/search';

@Controller('v1/admin/logs')
@Roles(Role.ADMIN)
export class LogsAdminController {
  constructor(private readonly logStore: LogStore) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  search(@Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase) {
    return this.logStore.search(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const item = await this.logStore.getById(id);
    if (!item) throw new NotFoundException(`Log ${id} not found`);
    return item;
  }
}
