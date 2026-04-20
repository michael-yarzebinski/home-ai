import { Body, Controller, Post } from '@nestjs/common';
import { SearchRequestDto } from '@home-ai/shared';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { toAIAuditDto } from './ai-audit.mapper';
import { AIAuditService } from './ai-audit.service';
import { ValidationService } from '../../../validation/validation.service';

@Controller('admin/ai-audit')
@Roles('admin')
export class AIAuditAdminController {
  constructor(
    private readonly validationService: ValidationService,
    private readonly aiAuditService: AIAuditService,
  ) {}

  @Post('search')
  async search(@Body() body: SearchRequestDto) {
    const searchRequest = await this.validationService.validateAndTransform(body, SearchRequestDto);
    const { audits, total, page, pageSize } = await this.aiAuditService.search(searchRequest);
    return {
      items: audits.map((a) => toAIAuditDto(a)),
      total,
      ...(page != null ? { pageNumber: page, pageSize } : {}),
    };
  }
}
