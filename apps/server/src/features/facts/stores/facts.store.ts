// features/facts/facts.store.ts
import type { Knex } from "knex";
import { AbstractEntityStore } from "../../../core/stores/abstract/abstract-entity.store";
import type { AuthUser } from "../../../core/auth/jwt.strategy";
import type {
  Fact,
  InsertableFact,
  UpdatableFact,
} from "@home-ai/shared/domain/fact/fact";
import { AuditStore } from "../../../core/stores/monitoring/audit/audit.store";
import { Inject, Injectable } from "@nestjs/common";
import { Role } from "@home-ai/shared/domain/role/role";

export interface FactRecord {
  id: string;
  key: string;
  value: string;
  tags: string[];
  read_roles: string[];
  write_roles: string[];
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class FactsStore extends AbstractEntityStore<
  Fact,
  FactRecord,
  InsertableFact,
  UpdatableFact
> {
  constructor(@Inject("KNEX_CONNECTION") knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, { tableName: "facts", entityType: "facts" });
  }

  protected validateUserForRead(
    query: Knex.QueryBuilder,
    user?: AuthUser,
  ): Knex.QueryBuilder {
    if (!user) return query;
    return query.whereRaw("read_roles @> jsonb_build_array(?::text)", [
      user.role,
    ]);
  }

  protected validateUserForWrite(
    query: Knex.QueryBuilder,
    user?: AuthUser,
  ): Knex.QueryBuilder {
    if (!user) return query;
    return query.whereRaw("write_roles @> jsonb_build_array(?::text)", [
      user.role,
    ]);
  }

  protected applyTextSearch(
    query: Knex.QueryBuilder,
    search: string,
  ): Knex.QueryBuilder {
    const like = `%${search.toLowerCase()}%`;
    return query.where((b) =>
      b
        .whereILike("key", like)
        .orWhereILike("value", like)
        .orWhereRaw("tags @> jsonb_build_array(?::text)", [
          search.toLowerCase(),
        ]),
    );
  }

  protected recordToDomain(record: FactRecord): Fact {
    return {
      id: record.id,
      key: record.key,
      value: record.value,
      tags: record.tags,
      readRoles: record.read_roles as Role[],
      writeRoles: record.write_roles as Role[],
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(domain: Fact): FactRecord {
    return {
      id: domain.id,
      key: domain.key,
      value: domain.value,
      tags: domain.tags,
      read_roles: domain.readRoles,
      write_roles: domain.writeRoles,
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }

  async getByKey(key: string, user: AuthUser): Promise<Fact | undefined> {
    let query = this.active;
    query = this.validateUserForRead(query, user);
    const record = await query.where("key", key).first();

    return record ? this.recordToDomain(record) : record;
  }
}
