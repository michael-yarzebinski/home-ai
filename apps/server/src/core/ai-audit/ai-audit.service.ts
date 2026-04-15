// apps/server/src/core/audit/ai-audit.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AIAuditStore } from './ai-audit.store';
import { AIAuditDomain } from './ai-audit.domain';

@Injectable()
export class AIAuditService {
  private readonly logger = new Logger(AIAuditService.name);

  constructor(
    private readonly aiAuditStore: AIAuditStore,
  ) {}

  reader() : Pick<AIAuditStore , 'findForUser' | 'findAll'> {
    return this.aiAuditStore;
  }

  // Log AI audit events
  async log(entry: Partial<AIAuditDomain>): Promise<void> {
    await this.aiAuditStore.log(entry);
  }
}