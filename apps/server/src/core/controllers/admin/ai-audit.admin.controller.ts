import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, Post } from '@nestjs/common';
import { AIAuditStore } from '../../stores/ai-audit/ai-audit.store';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@home-ai/shared/domain/role/role';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { SearchCriteriaSchema, type SearchCriteriaBase } from '@home-ai/shared/search/search';

@Controller('v1/admin/ai-audit')
@Roles(Role.ADMIN)
export class AIAuditAdminController {
  constructor(private readonly aiAuditStore: AIAuditStore) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  search(@Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase) {
    return this.aiAuditStore.search(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const item = await this.aiAuditStore.getById(id);
    if (!item) throw new NotFoundException(`AI audit record ${id} not found`);
    return item;
  }
}
