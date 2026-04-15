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
  reader(): Pick<LogStore, 'findForUser' | 'findAll'> {
    return this.logStore;
  }

  // Main logging method
  async log(entry: Partial<Log>): Promise<void> {
    await this.logStore.log(entry);
  }

  // Convenience methods
  async info(message: string, data?: Record<string, any>, userId?: string) {
    await this.log({ severity: 'info', message, data, userId });
  }

  async error(message: string, data?: Record<string, any>, userId?: string) {
    await this.log({ severity: 'error', message, data, userId });
  }

  async warn(message: string, data?: Record<string, any>, userId?: string) {
    await this.log({ severity: 'warn', message, data, userId });
  }

  async debug(message: string, data?: Record<string, any>, userId?: string) {
    await this.log({ severity: 'debug', message, data, userId });
  }
}