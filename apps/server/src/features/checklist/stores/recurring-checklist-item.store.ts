import type { Knex } from "knex";

import {
  AbstractEntityStore,
  type RequestUser,
} from "src/core/stores/abstract/abstract-entity.store";
import type {
  InsertableRecurringChecklistItem,
  RecurringChecklistItem,
  RecurringChecklistItemTriggerType,
  UpdatableRecurringChecklistItem,
} from "@home-ai/shared/domain/checklist/recurring-checklist-item";
import { AuditStore } from "src/core/stores/monitoring/audit/audit.store";
import { Inject, Injectable } from "@nestjs/common";
import { ChecklistItemPriority } from "@home-ai/shared/domain/checklist/checklist-item";

export interface RecurringChecklistItemRecord {
  id: string;
  checklist_id: string;
  title: string;
  description?: string | null;
  default_assignee_id?: string | null;
  priority: ChecklistItemPriority;
  tags: string[];
  trigger_type: RecurringChecklistItemTriggerType;
  trigger_config: Record<string, unknown>;
  depends_on_recurring_ids: string[];
  metadata: Record<string, unknown>;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class RecurringChecklistItemStore extends AbstractEntityStore<
  RecurringChecklistItem,
  RecurringChecklistItemRecord,
  InsertableRecurringChecklistItem,
  UpdatableRecurringChecklistItem
> {
  constructor(@Inject("KNEX_CONNECTION") knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, {
      tableName: "recurring_checklist_items",
      entityType: "recurring_checklist_items",
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
      b.whereILike("title", like).orWhereILike("description", like),
    );
  }

  protected recordToDomain(
    record: RecurringChecklistItemRecord,
  ): RecurringChecklistItem {
    return {
      id: record.id,
      checklistId: record.checklist_id,
      title: record.title,
      description: record.description ?? undefined,
      defaultAssigneeId: record.default_assignee_id ?? undefined,
      priority: record.priority,
      tags: record.tags ?? [],
      triggerType: record.trigger_type as RecurringChecklistItemTriggerType,
      triggerConfig: (record.trigger_config ??
        {}) as RecurringChecklistItem["triggerConfig"],
      dependsOnRecurringIds: record.depends_on_recurring_ids?.length
        ? record.depends_on_recurring_ids
        : undefined,
      metadata: record.metadata ?? {},
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(
    domain: RecurringChecklistItem,
  ): RecurringChecklistItemRecord {
    return {
      id: domain.id,
      checklist_id: domain.checklistId,
      title: domain.title,
      description: domain.description ?? null,
      default_assignee_id: domain.defaultAssigneeId ?? null,
      priority: domain.priority,
      tags: domain.tags ?? [],
      trigger_type: domain.triggerType,
      trigger_config: domain.triggerConfig ?? {},
      depends_on_recurring_ids: domain.dependsOnRecurringIds ?? [],
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
  ): Promise<RecurringChecklistItem[]> {
    let query = this.activeOrInactive(includeInactive);
    query = this.validateForRead(query, user);
    query = query.where({ checklist_id: checklistId });
    const records = (await query.orderBy(
      this.defaultOrder.column,
      this.defaultOrder.direction,
    )) as RecurringChecklistItemRecord[];
    return records.map((r) => this.recordToDomain(r));
  }

  async getByDependsOnMany(
    recurringItemIds: string[],
    includeInactive = false,
    user?: RequestUser,
  ): Promise<RecurringChecklistItem[]> {
    if (!recurringItemIds.length) return [];

    let query = this.activeOrInactive(includeInactive);
    query = this.validateForRead(query, user);
    query = query.whereRaw(
      "jsonb_exists_any(depends_on_recurring_ids, ?::text[])",
      [recurringItemIds],
    );
    const records = (await query.orderBy(
      this.defaultOrder.column,
      this.defaultOrder.direction,
    )) as RecurringChecklistItemRecord[];
    return records.map((r) => this.recordToDomain(r));
  }

  async getTags(user?: RequestUser): Promise<string[]> {
    const tags = (await this.validateForRead(this.active, user).select(
      "tags",
    )) as { tags: string[] }[];
    return [
      ...new Set(tags.map((t) => t.tags).flat().filter((t) => t !== undefined)),
    ];
  }

  async getByTags(
    tags: string[],
    includeInactive = false,
    user?: RequestUser,
  ): Promise<RecurringChecklistItem[]> {
    if (!tags.length) return [];

    let query = this.activeOrInactive(includeInactive);
    query = this.validateForRead(query, user);
    query = query.whereRaw("jsonb_exists_any(tags, ?::text[])", [tags]);
    const records = (await query.orderBy(
      this.defaultOrder.column,
      this.defaultOrder.direction,
    )) as RecurringChecklistItemRecord[];
    return records.map((r) => this.recordToDomain(r));
  }
}
