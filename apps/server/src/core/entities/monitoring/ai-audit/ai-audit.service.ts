import { SearchRequestDto, SearchUtils } from '@home-ai/shared';
import { Injectable } from '@nestjs/common';
import { AIAudit } from './ai-audit.domain';
import { AIAuditStore } from './ai-audit.store';

@Injectable()
export class AIAuditService {
  constructor(private readonly aiAuditStore: AIAuditStore) {}

  reader(): Pick<AIAuditStore, 'findForUser' | 'findForTaskRequest' | 'findByEventType' | 'getAll'> {
    return this.aiAuditStore;
  }

  async search(
    criteria: SearchRequestDto,
  ): Promise<{ audits: AIAudit[]; total: number; page: number; pageSize: number }> {
    const { skip, take } = SearchUtils.toSkipTake(criteria);
    const result = await this.aiAuditStore.search(
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

  async log(data: Omit<AIAudit, 'id' | 'timestamp'>): Promise<void> {
    return this.aiAuditStore.log(data);
  }
}