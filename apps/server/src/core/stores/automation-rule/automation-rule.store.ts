import { Injectable, Inject } from "@nestjs/common";
import { Knex } from "knex";
import {
  AbstractEntityStore,
} from "../abstract/abstract-entity.store";
import { AuditStore } from "../monitoring/audit/audit.store";
import type {
  AutomationAction,
  AutomationRule,
  InsertableAutomationRule,
  UpdatableAutomationRule,
  TriggerConfig,
} from "@home-ai/shared/domain/automation-rule/automation-rule";
import { TriggerType } from "@home-ai/shared/domain/automation-rule/automation-rule";
import { AuthUser } from "../../auth/jwt.strategy";

export interface AutomationRuleRecord {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  active: boolean;
  trigger: any; // Raw JSONB
  actions: any; // Raw JSONB
  cooldown_minutes: number;
  last_run: Date | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class AutomationRuleStore extends AbstractEntityStore<
  AutomationRule,
  AutomationRuleRecord,
  InsertableAutomationRule,
  UpdatableAutomationRule
> {
  constructor(@Inject("KNEX_CONNECTION") knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, {
      tableName: "automation_rules",
      entityType: "automation_rules",
    });
  }

  protected recordToDomain(record: AutomationRuleRecord): AutomationRule {
    // Cast the raw JSONB to our Discriminated Union
    // In a production app, you might use a Zod parser here for extra safety
    const trigger = record.trigger as TriggerConfig;

    return {
      id: record.id,
      userId: record.user_id,
      name: record.name,
      description: record.description ?? undefined,
      active: record.active,
      trigger: trigger,
      actions: record.actions as AutomationAction[],
      cooldownMinutes: record.cooldown_minutes,
      lastRun: record.last_run ?? undefined,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(domain: AutomationRule): AutomationRuleRecord {
    return {
      id: domain.id,
      user_id: domain.userId,
      name: domain.name,
      description: domain.description || null,
      // Stringify isn't strictly needed for Knex/Postgres jsonb,
      // as the driver handles objects, but we ensure the structure here.
      trigger: domain.trigger,
      actions: domain.actions,
      cooldown_minutes: domain.cooldownMinutes,
      last_run: domain.lastRun || null,
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }

  protected validateUserForRead(
    query: Knex.QueryBuilder,
    user: AuthUser,
  ): Knex.QueryBuilder {
    return query.where("user_id", user.id);
  }

  protected validateUserForWrite(
    query: Knex.QueryBuilder,
    user: AuthUser,
  ): Knex.QueryBuilder {
    return query.where("user_id", user.id);
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

  async getByUserId(userId: string): Promise<AutomationRule[]> {
    const records = await this.active.where("user_id", userId);

    return records.map((r) => this.recordToDomain(r));
  }

  async getByTriggerType(
    triggerType: TriggerType,
    deviceId?: string,
  ): Promise<AutomationRule[]> {
    let query = this.active.whereRaw("trigger->>'type' = ?", [triggerType]);

    if (deviceId) {
      query = query.andWhere((builder) => {
        builder.whereRaw("trigger->>'deviceId' = ?", [deviceId]);
      });
    }

    const records = await query;

    // Convert the DB records back into your strictly typed Domain objects
    return records.map((r) => this.recordToDomain(r));
  }

  async getForDevice(entityId: string): Promise<AutomationRule[]> {
    return this.getByTriggerType(TriggerType.DEVICE, entityId);
  }

  async updateLastRun(ruleIds: string[]): Promise<void> {
    if (ruleIds.length === 0) {
      return;
    }
    const now = new Date();
    for (const ruleId of ruleIds) {
      await this.table.where("id", ruleId).update({ last_run: now });
    }
  }
}
