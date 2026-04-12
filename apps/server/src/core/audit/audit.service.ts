import { Inject, Injectable, Logger } from '@nestjs/common';
import { Knex } from 'knex';
import { EntityAuditLog } from '../database/knex.constants';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async getAuditLogs(filters: {
    user_id?: string;
    event_type?: string;
    limit?: number;
  } = {}) {
    let query = this.knex('ai_audit').orderBy('timestamp', 'desc');

    if (filters.user_id) {
      query = query.where('user_id', filters.user_id);
    }

    if (filters.event_type) {
      query = query.where('event_type', filters.event_type);
    }

    return query.limit(filters.limit || 100);
  }

  async getAuditById(audit_id: number) {
    return this.knex('ai_audit').where('audit_id', audit_id).first();
  }

  /**
   * Log entity changes for stores. Used by AbstractEntityStore for automatic auditing.
   * Maps to ai_audit table with entity-specific metadata.
   * Falls back gracefully on audit failures.
   */
  async log(entry: EntityAuditLog): Promise<void> {
    try {
      await this.knex('ai_audit').insert({
        event_type: `entity_${entry.action.toLowerCase()}`,
        user_id: entry.userId || 'system',
        user_role: 'system',
        action: entry.action,
        task_name: entry.entityType.toLowerCase(),
        metadata: {
          ...entry.metadata,
          entityType: entry.entityType,
          entityId: entry.entityId,
          changes: entry.changes,
        },
        notes: `${entry.action} operation on ${entry.entityType}:${entry.entityId}`,
        status: 'success',
      });
      this.logger.debug(`Audited ${entry.action} on ${entry.entityType}:${entry.entityId}`);
    } catch (error) {
      // Audit must never break core business flows
      this.logger.error(`Audit log failed for ${entry.entityType}:${entry.entityId}`, error);
    }
  }
}
