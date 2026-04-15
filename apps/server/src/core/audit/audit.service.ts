// apps/server/src/core/audit/audit.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AuditStore } from './audit.store';
import { Audit } from './audit.domain';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly auditStore: AuditStore,
  ) {}

  reader(): Pick<AuditStore, 'findByEntity' | 'findForUser' | 'findAll'> {
    return this.auditStore;
  }
  // Entity Audit
  async log(entry: Omit<Audit, 'id' | 'timestamp'>): Promise<void> {
    await this.auditStore.log(entry);
  }
}