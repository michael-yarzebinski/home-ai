import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class AuditService {
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
}