import { SearchRequestDto, SearchUtils } from '@home-ai/shared';
import { Injectable, Logger } from '@nestjs/common';
import { Audit } from './audit.domain';
import { AuditStore } from './audit.store';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly auditStore: AuditStore,
  ) {}

  reader(): Pick<AuditStore, 'findByEntity' | 'findForUser' | 'getAll'> {
    return this.auditStore;
  }

  async search(
    criteria: SearchRequestDto,
  ): Promise<{ audits: Audit[]; total: number; page: number; pageSize: number }> {
    const { skip, take } = SearchUtils.toSkipTake(criteria);
    const result = await this.auditStore.search(
      criteria.search,
      skip,
      take,
      criteria.includeInactive,
    );
    return {
      audits: result.data,
      total: result.total,
      page: criteria.pageNumber ?? 1,
      pageSize: criteria.pageSize ?? 100,
    };
  }

  async log(entry: Omit<Audit, 'id' | 'timestamp'>): Promise<void> {
    await this.auditStore.log(entry);
  }
}