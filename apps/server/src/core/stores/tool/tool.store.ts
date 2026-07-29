// src/core/stores/tool/tool.store.ts
import type { Knex } from "knex";
import { AbstractEntityStore } from "../abstract/abstract-entity.store";
import type { AuthUser } from "../../auth/jwt.strategy";
import type {
  Tool,
  InsertableTool,
  UpdatableTool,
} from "@home-ai/shared/domain/tool/tool";
import { AuditStore } from "../monitoring/audit/audit.store";
import { Inject, Injectable } from "@nestjs/common";
import { Role } from "@home-ai/shared/domain/role/role";

export interface ToolRecord {
  id: string;
  name: string;
  friendly_name: string;
  hints?: string;
  request_roles: string[];
  write_roles: string[];
  notify_roles: string[];
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class ToolStore extends AbstractEntityStore<
  Tool,
  ToolRecord,
  InsertableTool,
  UpdatableTool
> {
  constructor(@Inject("KNEX_CONNECTION") knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, { tableName: "tools", entityType: "tools" });
  }

  protected validateUserForRead(
    query: Knex.QueryBuilder,
    user: AuthUser,
  ): Knex.QueryBuilder {
    return query.whereRaw("request_roles @> jsonb_build_array(?::text)", [
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
      b
        .whereILike("name", like)
        .orWhereILike("friendly_name", like)
        .orWhereILike("hints", like),
    );
  }

  protected recordToDomain(record: ToolRecord): Tool {
    return {
      id: record.id,
      name: record.name,
      friendlyName: record.friendly_name,
      requestRoles: record.request_roles as Role[],
      writeRoles: record.write_roles as Role[],
      notifyRoles: record.notify_roles as Role[],
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(domain: Tool): ToolRecord {
    return {
      id: domain.id,
      name: domain.name,
      friendly_name: domain.friendlyName,
      hints: domain.hints,
      request_roles: domain.requestRoles,
      write_roles: domain.writeRoles,
      notify_roles: domain.notifyRoles,
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }

  async getByName(name: string, user?: AuthUser): Promise<Tool | undefined> {
    let query = this.active.where("name", name);
    if (user) {
      query = this.validateForRead(query, user);
    }
    const record = await query.first();
    return record ? this.recordToDomain(record) : undefined;
  }

  override async getById(
    id: string,
    user?: AuthUser,
    includeInactive = false,
  ): Promise<Tool | null> {
    let query = this.activeOrInactive(includeInactive).where({ id });
    if (user) {
      query = this.validateForRead(query, user);
    }
    const record = (await query.first()) as ToolRecord | null;
    return record ? this.recordToDomain(record) : null;
  }

  override async getAll(
    user?: AuthUser,
    includeInactive = false,
  ): Promise<Tool[]> {
    let query = this.activeOrInactive(includeInactive);
    if (user) {
      query = this.validateForRead(query, user);
    }
    const records = (await query) as ToolRecord[];
    return records.map((r) => this.recordToDomain(r));
  }
}
