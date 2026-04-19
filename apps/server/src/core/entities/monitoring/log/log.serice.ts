// apps/server/src/core/log/log.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { LogStore } from './log.store';
import { Log } from './log.domain';

@Injectable()
export class LogService {

  constructor(
    private readonly logStore: LogStore,
  ) {}

  // Reader pattern - consistent with every other service
  reader(): Pick<LogStore, 'findForUser' | 'getAll'> {
    return this.logStore;
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