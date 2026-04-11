import { Controller, Get, Query, Param } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('admin/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getLogs(@Query() query: any) {
    return this.auditService.getAuditLogs({
      user_id: query.user_id,
      event_type: query.event_type,
      limit: query.limit ? parseInt(query.limit) : 100,
    });
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.auditService.getAuditById(parseInt(id));
  }
}