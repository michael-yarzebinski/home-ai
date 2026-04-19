// apps/server/src/core/audit/ai-audit.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AIAuditStore } from './ai-audit.store';
import { AIAudit } from './ai-audit.domain';

@Injectable()
export class AIAuditService {
  constructor(private readonly aiAuditStore: AIAuditStore) {}

  reader(): Pick<AIAuditStore, 'findForUser' | 'findForTaskRequest' | 'findByEventType' | 'getAll'> {
    return this.aiAuditStore;
  }

  async log(data: Omit<AIAudit, 'id' | 'timestamp'>): Promise<void> {
    return this.aiAuditStore.log(data);
  }
}