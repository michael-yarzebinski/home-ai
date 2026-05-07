import type { Knex } from "knex";

import {
  AbstractEntityStore,
  type RequestUser,
} from "src/core/stores/abstract/abstract-entity.store";
import {
  type ChecklistItem,
  type InsertableChecklistItem,
  type UpdatableChecklistItem,
  ChecklistItemPriority,
  ChecklistItemStatus,
} from "@home-ai/shared/domain/checklist/checklist-item";
import { AuditStore } from "src/core/stores/monitoring/audit/audit.store";
import { Inject, Injectable } from "@nestjs/common";

export interface ChecklistItemRecord {
  id: string;
  checklist_id: string;
  recurring_item_id?: string | null;
  title: string;
  description?: string | null;
  assignee_id?: string | null;
  priority: ChecklistItemPriority;
  due_date?: Date | null;
  status: ChecklistItemStatus;
  depends_on: string[];
  tags: string[];
  completed_at?: Date | null;
  completed_by?: string | null;
  metadata: Record<string, unknown>;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class ChecklistItemStore extends AbstractEntityStore<
  ChecklistItem,
  ChecklistItemRecord,
  InsertableChecklistItem,
  UpdatableChecklistItem
> {
  constructor(@Inject("KNEX_CONNECTION") knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, {
      tableName: "checklist_items",
      entityType: "checklist_items",
    });
  }

  protected validateForRead(
    query: Knex.QueryBuilder,
    _user?: RequestUser,
  ): Knex.QueryBuilder {
    return query;
  }

  protected validateForWrite(
    query: Knex.QueryBuilder,
    _user?: RequestUser,
  ): Knex.QueryBuilder {
    return query;
  }

  protected applyTextSearch(
    query: Knex.QueryBuilder,
    search: string,
  ): Knex.QueryBuilder {
    const like = `%${search.toLowerCase()}%`;
    return query.where((b) =>
      b
        .whereILike("title", like)
        .orWhereILike("description", like)
        .orWhereILike("assignee_id", like),
    );
  }

  protected recordToDomain(record: ChecklistItemRecord): ChecklistItem {
    return {
      id: record.id,
      checklistId: record.checklist_id,
      recurringItemId: record.recurring_item_id ?? undefined,
      title: record.title,
      description: record.description ?? undefined,
      assigneeId: record.assignee_id ?? undefined,
      priority: record.priority,
      dueDate: record.due_date ?? undefined,
      status: record.status,
      dependsOn: record.depends_on?.length ? record.depends_on : undefined,
      tags: record.tags ?? [],
      metadata: record.metadata ?? {},
      completedAt: record.completed_at ?? undefined,
      completedBy: record.completed_by ?? undefined,
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(domain: ChecklistItem): ChecklistItemRecord {
    return {
      id: domain.id,
      checklist_id: domain.checklistId,
      recurring_item_id: domain.recurringItemId ?? null,
      title: domain.title,
      description: domain.description ?? null,
      assignee_id: domain.assigneeId ?? null,
      priority: domain.priority,
      due_date: domain.dueDate ?? null,
      status: domain.status,
      depends_on: domain.dependsOn ?? [],
      tags: domain.tags ?? [],
      completed_at: domain.completedAt ?? null,
      completed_by: domain.completedBy ?? null,
      metadata: domain.metadata ?? {},
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }

  async getByChecklistId(
    checklistId: string,
    includeInactive = false,
    user?: RequestUser,
  ): Promise<ChecklistItem[]> {
    let query = this.activeOrInactive(includeInactive);
    query = this.validateForRead(query, user);
    query = query.where({ checklist_id: checklistId });
    const records = (await query.orderBy(
      this.defaultOrder.column,
      this.defaultOrder.direction,
    )) as ChecklistItemRecord[];
    return records.map((r) => this.recordToDomain(r));
  }

  async getByDependsOn(
    itemId: string,
    includeInactive = false,
    user?: RequestUser,
  ): Promise<ChecklistItem[]> {
    let query = this.activeOrInactive(includeInactive);
    query = this.validateForRead(query, user);
    query = query.whereRaw("jsonb_exists(depends_on, ?)", [itemId]);
    const records = (await query.orderBy(
      this.defaultOrder.column,
      this.defaultOrder.direction,
    )) as ChecklistItemRecord[];
    return records.map((r) => this.recordToDomain(r));
  }

  async getByDependsOnMany(
    itemIds: string[],
    includeInactive = false,
    user?: RequestUser,
  ): Promise<ChecklistItem[]> {
    if (!itemIds.length) return [];

    let query = this.activeOrInactive(includeInactive);
    query = this.validateForRead(query, user);
    query = query.whereRaw("jsonb_exists_any(depends_on, ?::text[])", [
      itemIds,
    ]);
    const records = (await query.orderBy(
      this.defaultOrder.column,
      this.defaultOrder.direction,
    )) as ChecklistItemRecord[];
    return records.map((r) => this.recordToDomain(r));
  }

  async getByTag(
    tag: string,
    includeInactive = false,
    user?: RequestUser,
  ): Promise<ChecklistItem[]> {
    let query = this.activeOrInactive(includeInactive);
    query = this.validateForRead(query, user);
    query = query.whereRaw("jsonb_exists(tags, ?)", [tag]);
    const records = (await query.orderBy(
      this.defaultOrder.column,
      this.defaultOrder.direction,
    )) as ChecklistItemRecord[];
    return records.map((r) => this.recordToDomain(r));
  }

  async getByAssigneeId(
    assigneeId: string,
    includeInactive = false,
    user?: RequestUser,
  ): Promise<ChecklistItem[]> {
    let query = this.activeOrInactive(includeInactive);
    query = this.validateForRead(query, user);
    query = query
      .where({ assignee_id: assigneeId })
      .whereIn("status", [
        ChecklistItemStatus.PENDING,
        ChecklistItemStatus.BLOCKED,
      ]);
    const records = (await query.orderBy(
      this.defaultOrder.column,
      this.defaultOrder.direction,
    )) as ChecklistItemRecord[];
    return records.map((r) => this.recordToDomain(r));
  }
}
