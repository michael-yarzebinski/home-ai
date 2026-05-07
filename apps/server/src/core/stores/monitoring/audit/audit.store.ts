// core/stores/audit/audit.store.ts
import { AbstractMonitoringStore } from "../abstract/abstract-monitoring.store";
import type { Audit } from "@home-ai/shared/domain/audit/audit";
import { Knex } from "knex";
import { Inject, Injectable } from "@nestjs/common";

export interface AuditRecord {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  user_id?: string;
  changes: any;
  notes?: string;
  created_at: Date;
}

@Injectable()
export class AuditStore extends AbstractMonitoringStore<Audit, AuditRecord> {
  constructor(@Inject("KNEX_CONNECTION") knex: Knex) {
    super(knex, { tableName: "audit" });
  }

  protected applyTextSearch(
    query: Knex.QueryBuilder,
    text: string,
  ): Knex.QueryBuilder {
    const like = `%${text}%`;
    return query.where((b) =>
      b
        .whereILike("entity_type", like)
        .orWhereILike("entity_id", like)
        .orWhereILike("action", like)
        .orWhereILike("notes", like),
    );
  }

  protected recordToDomain(record: AuditRecord): Audit {
    return {
      id: record.id,
      entityType: record.entity_type,
      entityId: record.entity_id,
      action: record.action,
      userId: record.user_id,
      changes: record.changes,
      notes: record.notes,
      createdAt: record.created_at,
    };
  }

  protected domainToRecord(domain: Audit): AuditRecord {
    return {
      id: domain.id,
      entity_type: domain.entityType,
      entity_id: domain.entityId,
      action: domain.action,
      user_id: domain.userId,
      changes: domain.changes,
      notes: domain.notes,
      created_at: domain.createdAt,
    };
  }

  // async create(stuff: any) {
  //     console.log(stuff)
  // }
}
