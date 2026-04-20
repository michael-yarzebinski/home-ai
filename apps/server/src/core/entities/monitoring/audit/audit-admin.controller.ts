import { Body, Controller, DefaultValuePipe, Post } from '@nestjs/common';
import { SearchRequestDto } from '@home-ai/shared';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { toAuditDto } from './audit.mapper';
import { AuditService } from './audit.service';
import { ValidationService } from '../../../validation/validation.service';

@Controller('admin/audit')
@Roles('admin')
export class AuditAdminController {
  constructor(
    private readonly validationService: ValidationService,
    private readonly auditService: AuditService,
  ) {}

  @Post('search')
  async search(@Body(new DefaultValuePipe({})) body: SearchRequestDto) {
    const searchRequest = await this.validationService.validateAndTransform(body, SearchRequestDto);
    const { audits, total, page, pageSize } = await this.auditService.search(searchRequest);
    return {
      items: audits.map((a) => toAuditDto(a)),
      total,
      ...(page != null ? { pageNumber: page, pageSize } : {}),
    };
  }
}
