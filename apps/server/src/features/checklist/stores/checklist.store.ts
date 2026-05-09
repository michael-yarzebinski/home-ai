import type { Knex } from "knex";

import { AbstractEntityStore } from "src/core/stores/abstract/abstract-entity.store";
import type { AuthUser } from "src/core/auth/jwt.strategy";
import type {
  Checklist,
  InsertableChecklist,
  UpdatableChecklist,
} from "@home-ai/shared/domain/checklist/checklist";
import { AuditStore } from "src/core/stores/monitoring/audit/audit.store";
import { Inject, Injectable } from "@nestjs/common";
import { Role } from "@home-ai/shared/domain/role/role";

export interface ChecklistRecord {
  id: string;
  name: string;
  description?: string | null;
  read_roles: string[];
  write_roles: string[];
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class ChecklistStore extends AbstractEntityStore<
  Checklist,
  ChecklistRecord,
  InsertableChecklist,
  UpdatableChecklist
> {
  constructor(@Inject("KNEX_CONNECTION") knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, {
      tableName: "checklists",
      entityType: "checklists",
    });
  }

  protected validateUserForRead(
    query: Knex.QueryBuilder,
    user: AuthUser,
  ): Knex.QueryBuilder {
    return query.whereRaw("read_roles @> jsonb_build_array(?::text)", [
      user.role,
    ]);
  }

  protected validateUserForWrite(
    query: Knex.QueryBuilder,
    user: AuthUser,
  ): Knex.QueryBuilder {
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
      b.whereILike("name", like).orWhereILike("description", like),
    );
  }

  protected recordToDomain(record: ChecklistRecord): Checklist {
    return {
      id: record.id,
      name: record.name,
      description: record.description ?? undefined,
      readRoles: record.read_roles as Role[],
      writeRoles: record.write_roles as Role[],
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(domain: Checklist): ChecklistRecord {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description ?? null,
      read_roles: domain.readRoles,
      write_roles: domain.writeRoles,
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }

  /** Active checklist the user may mutate per {@link validateUserForWrite} (write_roles). */
  async getByIdForWrite(
    id: string,
    user: AuthUser,
    includeInactive = false,
  ): Promise<Checklist | null> {
    let query = this.activeOrInactive(includeInactive);
    query = this.validateUserForWrite(query, user);
    const record = (await query
      .where({ id })
      .first()) as ChecklistRecord | null;
    return record ? this.recordToDomain(record) : null;
  }
}
