import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { AuditService } from '../entities/monitoring/audit/audit.service';
import { AbstractEntityStore } from '../entities/abstract-entity.store';
import { KNEX_CONNECTION } from '../database/knex.constants';
import { Fact } from './fact.domain';
import { User } from '../entities/user/user.domain';

export interface FactRecord {
  id: string;
  key: string;
  value: string;
  owner_user_id?: string | null;
  visible_to_roles: any;   // jsonb
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class FactStore extends AbstractEntityStore<FactRecord, Fact> {
  constructor(
    @Inject(KNEX_CONNECTION) knex: Knex,
    auditService: AuditService,
  ) {
    super(knex, auditService, {
      tableName: 'facts',
      auditEntityType: 'Fact',
      primaryKey: 'id',
      hasUpdatedAt: true,
      hasActiveFlag: false,
    });
  }

  protected domainToRecord(domain: Partial<Fact>): Partial<FactRecord> {
    return {
      id: domain.id,
      key: domain.key,
      value: domain.value,
      owner_user_id: domain.ownerUserId,
      visible_to_roles: domain.visibleToRoles ? JSON.stringify(domain.visibleToRoles) : [],   // Pass array directly
    };
  }
  
  protected recordToDomain(record: FactRecord): Fact {
    return {
      id: record.id,
      key: record.key,
      value: record.value,
      ownerUserId: record.owner_user_id ?? undefined,
      visibleToRoles: Array.isArray(record.visible_to_roles) 
        ? record.visible_to_roles 
        : [],
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  async getFactsByUser(user: User): Promise<Fact[]> {
    const records = await this.knex<FactRecord>('facts')
      .where((builder) => {
        builder
          // User is the owner
          .where('owner_user_id', user.id)
          // OR the fact's visibility_roles array contains the user's role
          .orWhereRaw('visible_to_roles @> ?', [JSON.stringify([user.role])]);
      })
      .orderBy('created_at', 'desc');
  
    return records.map(record => this.recordToDomain(record));
  }
}