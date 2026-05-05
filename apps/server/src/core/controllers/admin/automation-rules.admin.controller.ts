import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  NotFoundException, Param, Post, Put,
} from '@nestjs/common';
import { AutomationRuleStore } from '../../stores/automation-rule/automation-rule.store';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@home-ai/shared/domain/role/role';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { SearchCriteriaSchema, type SearchCriteriaBase } from '@home-ai/shared/search/search';
import {
  InsertableAutomationRuleSchema, UpdatableAutomationRuleSchema,
  type InsertableAutomationRule, type UpdatableAutomationRule,
} from '@home-ai/shared/domain/automation-rule/automation-rule';

@Controller('v1/admin/automation-rules')
@Roles(Role.ADMIN)
export class AutomationRulesAdminController {
  constructor(private readonly automationRuleStore: AutomationRuleStore) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  search(@Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase) {
    return this.automationRuleStore.search(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const item = await this.automationRuleStore.getById(id, true);
    if (!item) throw new NotFoundException(`AutomationRule ${id} not found`);
    return item;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(new ZodValidationPipe(InsertableAutomationRuleSchema)) dto: InsertableAutomationRule) {
    return this.automationRuleStore.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdatableAutomationRuleSchema)) dto: UpdatableAutomationRule) {
    return this.automationRuleStore.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param('id') id: string) {
    return this.automationRuleStore.softDelete(id);
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    await this.automationRuleStore.restore(id);
    return this.automationRuleStore.getById(id, true);
  }
}
