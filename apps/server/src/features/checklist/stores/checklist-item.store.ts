import type { Knex } from "knex";

import { AbstractEntityStore } from "src/core/stores/abstract/abstract-entity.store";
import type { AuthUser } from "src/core/auth/jwt.strategy";
import {
  type ChecklistItem,
  type InsertableChecklistItem,
  type UpdatableChecklistItem,
  ChecklistItemPriority,
  ChecklistItemStatus,
} from "@home-ai/shared/domain/checklist/checklist-item";
import { parseDuration, type Duration } from "@home-ai/shared/common/duration";
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
  notify_before?: Duration | null;
  reminder_sent_at?: Date | null;
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

  protected validateUserForRead(
    query: Knex.QueryBuilder,
    _user: AuthUser,
  ): Knex.QueryBuilder {
    return query;
  }

  protected validateUserForWrite(
    query: Knex.QueryBuilder,
    _user: AuthUser,
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
      notifyBefore: parseDuration(record.notify_before),
      reminderSentAt: record.reminder_sent_at ?? undefined,
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
    // Omitted keys stay undefined so partial updates do not null sibling columns.
    return {
      id: domain.id,
      checklist_id: domain.checklistId,
      recurring_item_id: this.present(domain, "recurringItemId", (v) => v ?? null),
      title: domain.title,
      description: this.present(domain, "description", (v) => v ?? null),
      assignee_id: this.present(domain, "assigneeId", (v) => v ?? null),
      priority: domain.priority,
      due_date: this.present(domain, "dueDate", (v) => v ?? null),
      notify_before: this.present(domain, "notifyBefore", (v) => v ?? null),
      reminder_sent_at: this.present(domain, "reminderSentAt", (v) => v ?? null),
      status: domain.status,
      depends_on: this.present(domain, "dependsOn", (v) => v ?? []),
      tags: this.present(domain, "tags", (v) => v ?? []),
      completed_at: this.present(domain, "completedAt", (v) => v ?? null),
      completed_by: this.present(domain, "completedBy", (v) => v ?? null),
      metadata: this.present(domain, "metadata", (v) => v ?? {}),
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    } as ChecklistItemRecord;
  }

  private present<K extends keyof ChecklistItem, T>(
    domain: ChecklistItem,
    key: K,
    map: (value: ChecklistItem[K]) => T,
  ): T | undefined {
    if (!Object.prototype.hasOwnProperty.call(domain, key)) {
      return undefined;
    }
    return map(domain[key]);
  }

  async getByChecklistId(
    checklistId: string,
    user: AuthUser,
    includeInactive = false,
  ): Promise<ChecklistItem[]> {
    let query = this.activeOrInactive(includeInactive);
    query = this.validateUserForRead(query, user);
    query = query.where({ checklist_id: checklistId });
    const records = (await query.orderBy(
      this.defaultOrder.column,
      this.defaultOrder.direction,
    )) as ChecklistItemRecord[];
    return records.map((r) => this.recordToDomain(r));
  }

  async getLatestByRecurringItemIds(
    recurringItemIds: string[],
    includeInactive = false,
  ): Promise<Map<string, ChecklistItem>> {
    if (!recurringItemIds.length) return new Map();

    const query = this.activeOrInactive(includeInactive);
    const records = (await query
      .whereIn("recurring_item_id", recurringItemIds)
      .whereNotNull("recurring_item_id")
      .orderBy("recurring_item_id", "asc")
      .orderBy("created_at", "desc")) as (ChecklistItemRecord & {
      recurring_item_id: string;
    })[];

    const latestByRecurringId = new Map<string, ChecklistItem>();
    for (const record of records) {
      // We only want the latest one, so skip any others
      if (latestByRecurringId.has(record.recurring_item_id)) {
        continue;
      }

      latestByRecurringId.set(
        record.recurring_item_id,
        this.recordToDomain(record),
      );
    }

    return latestByRecurringId;
  }

  async getByDependsOn(
    itemId: string,
    user: AuthUser,
    includeInactive = false,
  ): Promise<ChecklistItem[]> {
    let query = this.activeOrInactive(includeInactive);
    query = this.validateUserForRead(query, user);
    query = query.whereRaw("jsonb_exists(depends_on, ?)", [itemId]);
    const records = (await query.orderBy(
      this.defaultOrder.column,
      this.defaultOrder.direction,
    )) as ChecklistItemRecord[];
    return records.map((r) => this.recordToDomain(r));
  }

  async getByDependsOnMany(
    itemIds: string[],
    user: AuthUser,
    includeInactive = false,
  ): Promise<ChecklistItem[]> {
    if (!itemIds.length) return [];

    let query = this.activeOrInactive(includeInactive);
    query = this.validateUserForRead(query, user);
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
    user: AuthUser,
    includeInactive = false,
  ): Promise<ChecklistItem[]> {
    let query = this.activeOrInactive(includeInactive);
    query = this.validateUserForRead(query, user);
    query = query.whereRaw("jsonb_exists(tags, ?)", [tag]);
    const records = (await query.orderBy(
      this.defaultOrder.column,
      this.defaultOrder.direction,
    )) as ChecklistItemRecord[];
    return records.map((r) => this.recordToDomain(r));
  }

  async findDueReminderCandidates(): Promise<ChecklistItem[]> {
    const records = (await this.active
      .whereNotNull("due_date")
      .whereNotNull("notify_before")
      .whereNotNull("assignee_id")
      .whereNull("reminder_sent_at")
      .whereNot("status", ChecklistItemStatus.COMPLETED)) as ChecklistItemRecord[];
    return records.map((record) => this.recordToDomain(record));
  }

  async markReminderSent(id: string, sentAt: Date = new Date()): Promise<void> {
    await this.table.where({ id }).update({
      reminder_sent_at: sentAt,
      updated_at: sentAt,
    });
  }

  async getByAssigneeId(
    assigneeId: string,
    user: AuthUser,
    includeInactive = false,
  ): Promise<ChecklistItem[]> {
    let query = this.activeOrInactive(includeInactive);
    query = this.validateUserForRead(query, user);
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
