import { SearchRequestDto, SearchUtils } from '@home-ai/shared';
import { Injectable } from '@nestjs/common';
import { Log } from './log.domain';
import { LogStore } from './log.store';

@Injectable()
export class LogService {

  constructor(
    private readonly logStore: LogStore,
  ) {}

  // Reader pattern - consistent with every other service
  reader(): Pick<LogStore, 'findForUser' | 'getAll'> {
    return this.logStore;
  }

  async search(
    criteria: SearchRequestDto,
  ): Promise<{ logs: Log[]; total: number; page: number; pageSize: number }> {
    const { skip, take } = SearchUtils.toSkipTake(criteria);
    const result = await this.logStore.search(
      criteria.search,
      skip,
      take,
      criteria.includeInactive,
    );
    return {
      logs: result.data,
      total: result.total,
      page: criteria.pageNumber ?? 1,
      pageSize: criteria.pageSize ?? 100,
    };
  }

  async log(data: {
    severity?: string;
    message?: string;
    data?: Record<string, any>;
    userId?: string;
  }): Promise<void> {
    return this.logStore.log(data);
  }
}