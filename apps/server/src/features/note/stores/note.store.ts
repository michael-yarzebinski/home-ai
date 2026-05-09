import type { Knex } from "knex";

import { AbstractEntityStore } from "../../../core/stores/abstract/abstract-entity.store";
import type { AuthUser } from "../../../core/auth/jwt.strategy";
import type {
  Note,
  InsertableNote,
  UpdatableNote,
} from "@home-ai/shared/domain/note/note";
import { AuditStore } from "../../../core/stores/monitoring/audit/audit.store";
import { Inject, Injectable } from "@nestjs/common";
import { Role } from "@home-ai/shared/domain/role/role";

export interface NoteRecord {
  id: string;
  name: string;
  friendly_name: string;
  aliases: string[];
  read_roles: string[];
  write_roles: string[];
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class NoteStore extends AbstractEntityStore<
  Note,
  NoteRecord,
  InsertableNote,
  UpdatableNote
> {
  constructor(@Inject("KNEX_CONNECTION") knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, { tableName: "notes", entityType: "notes" });
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
      b.whereILike("name", like).orWhereILike("friendly_name", like),
    );
  }

  protected recordToDomain(record: NoteRecord): Note {
    return {
      id: record.id,
      name: record.name,
      friendlyName: record.friendly_name,
      aliases: record.aliases,
      readRoles: record.read_roles as Role[],
      writeRoles: record.write_roles as Role[],
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(domain: Note): NoteRecord {
    return {
      id: domain.id,
      name: domain.name,
      friendly_name: domain.friendlyName,
      aliases: domain.aliases,
      read_roles: domain.readRoles,
      write_roles: domain.writeRoles,
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }
}
