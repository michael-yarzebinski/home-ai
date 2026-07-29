// src/core/stores/pending-action/pending-action.store.ts
import type { Knex } from "knex";
import { AbstractEntityStore } from "../abstract/abstract-entity.store";
import type {
  InsertablePendingAction,
  PendingAction,
  UpdatablePendingAction,
} from "@home-ai/shared/domain/pending-action/pending-action";
import { AuditStore } from "../monitoring/audit/audit.store";
import { Inject, Injectable } from "@nestjs/common";
import { AuthUser } from "../../auth/jwt.strategy";

export interface PendingActionRecord {
  id: string;
  readable_id: number;
  tool_id: string;
  requester_id: string;
  proposed_args: any;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  executed_by?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class PendingActionStore extends AbstractEntityStore<
  PendingAction,
  PendingActionRecord,
  InsertablePendingAction,
  UpdatablePendingAction
> {
  constructor(@Inject("KNEX_CONNECTION") knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, {
      tableName: "pending_actions",
      entityType: "pending_actions",
    });
  }

  protected validateUserForRead(
    query: Knex.QueryBuilder,
    user: AuthUser,
  ): Knex.QueryBuilder {
    return query.where("requester_id", user.id);
  }

  protected validateUserForWrite(
    query: Knex.QueryBuilder,
    user: AuthUser,
  ): Knex.QueryBuilder {
    return query.where("requester_id", user.id);
  }

  protected applyTextSearch(
    query: Knex.QueryBuilder,
    search: string,
  ): Knex.QueryBuilder {
    const like = `%${search.toLowerCase()}%`;
    return query.where((b) =>
      b.whereILike("status", like).orWhereILike("reason", like),
    );
  }

  protected recordToDomain(record: PendingActionRecord): PendingAction {
    return {
      id: record.id,
      readableId: record.readable_id,
      toolId: record.tool_id,
      requesterId: record.requester_id,
      proposedArgs: record.proposed_args,
      status: record.status,
      reason: record.reason,
      executedBy: record.executed_by,
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(domain: PendingAction): PendingActionRecord {
    return {
      id: domain.id,
      readable_id: domain.readableId,
      tool_id: domain.toolId,
      requester_id: domain.requesterId,
      proposed_args: domain.proposedArgs,
      status: domain.status,
      reason: domain.reason,
      executed_by: domain.executedBy,
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }

  async getByReadableId(
    readableId: number,
    user?: AuthUser,
    includeInactive = false,
  ): Promise<PendingAction | undefined> {
    let query = this.activeOrInactive(includeInactive);
    if (user) {
      query = this.validateUserForRead(query, user);
    }
    const record = await query.where("readable_id", readableId).first();

    return record ? this.recordToDomain(record) : record;
  }

  async approve(
    id: string,
    approvedBy: string,
    user: AuthUser,
  ): Promise<PendingAction> {
    return this.update(
      id,
      {
        status: "approved",
        executedBy: approvedBy,
      },
      user,
    );
  }

  async getAllPendingActions(): Promise<PendingAction[]> {
    const records = await this.active.where("status", "pending");

    return records.map((r) => this.recordToDomain(r));
  }
}
