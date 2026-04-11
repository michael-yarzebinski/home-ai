import { Module } from '@nestjs/common';
import { AuditTool } from '../../ai/tools/utility-tools/audit.tool';
import { KnexModule } from '../../common/database/knex.module';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Module({
  imports: [KnexModule],
  controllers: [AuditController],
  providers: [AuditService, AuditTool],
  exports: [AuditService, AuditTool],
})
export class AuditModule {}