import { Knex } from "knex";
import { BaseStore } from "./base.store.interface";
import type {
  Insertable,
  Updatable,
} from "@home-ai/shared/common/crud.helper";
import type {
  SearchCriteria,
  SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import type { Role } from "@home-ai/shared/domain/role/role";

import { AuditStore } from "../monitoring/audit/audit.store";
import { Paginated } from "@home-ai/shared/search/pagination";
import { Id } from "../monitoring/abstract/abstract-monitoring.store";
import { EntityNotFoundError } from "../../../common/errors/entity-not-found.error";
import { Inject, Injectable } from "@nestjs/common";

export type RequestUser = { id: string; role: Role };

export type AuditableEntity = Id & {
  active: boolean;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export abstract class AbstractEntityStore<
  TDomain extends Id,
  TRecord extends AuditableEntity,
  TInsertable = Insertable<TDomain>,
  TUpdatable = Updatable<TDomain>,
  TSearchCriteria extends SearchCriteriaBase = SearchCriteriaBase,
> implements BaseStore<
  TDomain,
  TRecord,
  TInsertable,
  TUpdatable,
  TSearchCriteria
> {
  private readonly tableName: string;
  private readonly entityType: string;

  private readonly knex: Knex;
  private readonly auditStore: AuditStore;

  protected constructor(
    @Inject("KNEX_CONNECTION") knex: Knex,
    auditStore: AuditStore,
    options: { tableName: string; entityType: string },
  ) {
    this.knex = knex;
    this.auditStore = auditStore;
    this.tableName = options.tableName;
    this.entityType = options.entityType;
  }

  // ---------------------------------------------------------------------------
  // Abstract — subclasses must implement
  // ---------------------------------------------------------------------------

  /**
   * Applies row-level visibility scoping to a query.
   * Called inside search(), getById(), getAll(), and getByIds() when a user is provided.
   * Must be applied BEFORE COUNT(*) and LIMIT/OFFSET so pagination totals are correct.
   *
   * - No user (internal/tool call): return query unchanged.
   * - Admin role: return query unchanged.
   * - Regular user: add WHERE user_id = user.id (for user-scoped entities).
   * - Shared entities (devices, calendars, etc.): return query unchanged.
   */
  protected abstract validateForRead(
    query: Knex.QueryBuilder,
    user?: RequestUser,
  ): Knex.QueryBuilder;

  /**
   * Applies ownership scoping to the WHERE clause on UPDATE, DELETE, and RESTORE.
   * Acts as a hard safety net at the data layer — if the controller pre-check passes
   * but the user shouldn't own the record, the mutation affects 0 rows.
   *
   * Same scoping rules as validateForRead.
   */
  protected abstract validateForWrite(
    query: Knex.QueryBuilder,
    user?: RequestUser,
  ): Knex.QueryBuilder;

  /**
   * Applies full-text search filtering for the given search string.
   * Called inside search() when criteria.query is non-empty.
   * Use ILike / whereRaw for appropriate columns per entity type.
   */
  protected abstract applyTextSearch(
    query: Knex.QueryBuilder,
    searchString: string,
  ): Knex.QueryBuilder;

  protected abstract recordToDomain(record: TRecord): TDomain;
  protected abstract domainToRecord(domain: TDomain): TRecord;

  // ---------------------------------------------------------------------------
  // Query helpers
  // ---------------------------------------------------------------------------

  protected get table(): Knex.QueryBuilder<TRecord, TRecord[]> {
    return this.knex(this.tableName);
  }

  protected get active(): Knex.QueryBuilder<TRecord, TRecord[]> {
    return this.table.where({ active: true });
  }

  /** Subclasses can override to change the default sort column for search(). */
  protected get defaultOrder(): { column: string; direction: "asc" | "desc" } {
    return { column: "created_at", direction: "desc" };
  }

  protected activeOrInactive(
    includeInactive: boolean,
  ): Knex.QueryBuilder<TRecord, TRecord[]> {
    return includeInactive ? this.table : this.active;
  }

  // ---------------------------------------------------------------------------
  // Read operations
  // ---------------------------------------------------------------------------

  /**
   * Paginated, filtered search. Drives the admin and user-facing entity tables.
   * validateForRead and applyTextSearch are applied before COUNT(*) and LIMIT/OFFSET
   * so that pagination totals always reflect the caller's scoped record set.
   */
  async search(
    criteria: SearchCriteria<TSearchCriteria>,
    user?: RequestUser,
  ): Promise<Paginated<TDomain>> {
    let query = this.table;

    query = this.validateForRead(query, user);

    if (!criteria.includeInactive) {
      query = query.where({ active: true });
    }

    if (criteria.query?.trim()) {
      query = this.applyTextSearch(query, criteria.query.trim());
    }

    const countRow = (await query.clone().count("* as count").first()) as
      | { count: string }
      | undefined;
    const total = parseInt(countRow?.count ?? "0", 10);

    const offset = (criteria.page - 1) * criteria.pageSize;
    const records = (await query
      .orderBy(this.defaultOrder.column, this.defaultOrder.direction)
      .offset(offset)
      .limit(criteria.pageSize)) as TRecord[];
    const items = records.map((r) => this.recordToDomain(r));

    return {
      items,
      total,
      page: criteria.page,
      pageSize: criteria.pageSize,
      hasNext: offset + items.length < total,
      hasPrevious: criteria.page > 1,
    };
  }

  async getById(
    id: string,
    includeInactive = false,
    user?: RequestUser,
  ): Promise<TDomain | null> {
    let query = this.activeOrInactive(includeInactive);
    query = this.validateForRead(query, user);
    const record = (await query.where({ id }).first()) as TRecord | null;
    return record ? this.recordToDomain(record) : null;
  }

  async getByIds(
    ids: string[],
    includeInactive = false,
    user?: RequestUser,
  ): Promise<TDomain[]> {
    let query = this.activeOrInactive(includeInactive);
    query = this.validateForRead(query, user);
    const records = (await query.whereIn("id", ids)) as TRecord[];
    return records.map((r) => this.recordToDomain(r));
  }

  async getAll(
    includeInactive = false,
    user?: RequestUser,
  ): Promise<TDomain[]> {
    let query = this.activeOrInactive(includeInactive);
    query = this.validateForRead(query, user);
    const records = (await query) as TRecord[];
    return records.map((r) => this.recordToDomain(r));
  }

  // ---------------------------------------------------------------------------
  // Write operations
  // ---------------------------------------------------------------------------

  async create(data: TInsertable, user?: RequestUser): Promise<TDomain> {
    const record = this.domainToRecord(data as any);
    const [inserted] = (await this.table
      .insert(record as any)
      .returning("*")) as TRecord[];
    const domain = this.recordToDomain(inserted);

    await this.auditStore.create({
      entityType: this.entityType,
      entityId: domain.id,
      action: "create",
      userId: user?.id,
      changes: { old: null, new: inserted },
    });

    return domain;
  }

  async update(
    id: string,
    update: TUpdatable,
    user?: RequestUser,
  ): Promise<TDomain> {
    const old = await this.getById(id, true);
    if (!old) throw new EntityNotFoundError(this.entityType, id);

    const fullRecord = this.domainToRecord(update as any);
    // Strip undefined so only explicitly-provided fields are patched;
    // undefined columns would otherwise be sent as NULL to the database.
    const patch = Object.fromEntries(
      Object.entries(fullRecord).filter(([, v]) => v !== undefined),
    );

    let query = this.table.where({ id });
    query = this.validateForWrite(query, user);

    const [updated] = (await query
      .update(patch as any)
      .returning("*")) as TRecord[];

    const domain = this.recordToDomain(updated);

    await this.auditStore.create({
      entityType: this.entityType,
      entityId: id,
      action: "update",
      userId: user?.id,
      changes: { old, new: updated },
    });

    return domain;
  }

  async softDelete(id: string, user?: RequestUser): Promise<void> {
    let query = this.table.where({ id });
    query = this.validateForWrite(query, user);
    await query.update({ active: false } as any);

    await this.auditStore.create({
      entityType: this.entityType,
      entityId: id,
      action: "soft_delete",
      userId: user?.id,
      changes: {},
    });
  }

  async restore(id: string, user?: RequestUser): Promise<void> {
    let query = this.table.where({ id });
    query = this.validateForWrite(query, user);
    await query.update({ active: true } as any);

    await this.auditStore.create({
      entityType: this.entityType,
      entityId: id,
      action: "restore",
      userId: user?.id,
      changes: {},
    });
  }
}
