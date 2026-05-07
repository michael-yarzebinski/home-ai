// src/core/stores/user/user.store.ts
import type { Knex } from "knex";
import { AbstractEntityStore } from "../abstract/abstract-entity.store";
import type {
  User,
  InsertableUser,
  UpdatableUser,
} from "@home-ai/shared/domain/user/user";
import { AuditStore } from "../monitoring/audit/audit.store";
import { Inject, Injectable } from "@nestjs/common";
import { Role } from "@home-ai/shared/domain/role/role";

export interface UserRecord {
  id: string;
  role: string;
  name: string;
  phone_number?: string;
  access_code_hash: string;
  timezone: string;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class UserStore extends AbstractEntityStore<
  User,
  UserRecord,
  InsertableUser,
  UpdatableUser
> {
  constructor(@Inject("KNEX_CONNECTION") knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, { tableName: "users", entityType: "users" });
  }

  protected validateForRead(query: Knex.QueryBuilder): Knex.QueryBuilder {
    return query; // Admin-managed — role enforced at route level.
  }

  protected validateForWrite(query: Knex.QueryBuilder): Knex.QueryBuilder {
    return query;
  }

  protected applyTextSearch(
    query: Knex.QueryBuilder,
    search: string,
  ): Knex.QueryBuilder {
    const like = `%${search.toLowerCase()}%`;
    return query.where((b) =>
      b.whereILike("name", like).orWhereILike("phone_number", like),
    );
  }

  protected recordToDomain(record: UserRecord): User {
    return {
      id: record.id,
      role: record.role as Role,
      name: record.name,
      phoneNumber: record.phone_number,
      accessCodeHash: record.access_code_hash,
      timezone: record.timezone,
      quietHoursStart: record.quiet_hours_start,
      quietHoursEnd: record.quiet_hours_end,
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(domain: User): UserRecord {
    return {
      id: domain.id,
      role: domain.role,
      name: domain.name,
      phone_number: domain.phoneNumber,
      access_code_hash: domain.accessCodeHash,
      timezone: domain.timezone,
      quiet_hours_start: domain.quietHoursStart,
      quiet_hours_end: domain.quietHoursEnd,
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }

  async getByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    const record = await this.active.where("phone_number", phoneNumber).first();

    return record ? this.recordToDomain(record) : record;
  }

  async getUsersByRoles(roles: Role[]): Promise<User[]> {
    if (roles.length === 0) {
      return [];
    }

    const records = await this.active.whereIn("role", roles);

    return records.map((r) => this.recordToDomain(r));
  }
}
