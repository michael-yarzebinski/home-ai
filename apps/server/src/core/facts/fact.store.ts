import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { AuditService } from '../audit/audit.service';
import { AbstractEntityStore } from '../abstract-entity.store';
import { EntityStoreOptions, KNEX_CONNECTION } from '../database/knex.constants';
import { Fact } from './fact.domain';

export interface FactRecord {
  fact_id?: number;
  key: string;
  value: string;
  owner_user_id?: string | null;
  visibility_roles?: string;
  created_at?: Date;
  updated_at?: Date;
}

@Injectable()
export class FactStore extends AbstractEntityStore<FactRecord, Fact> {
  constructor(
    @Inject(KNEX_CONNECTION) knex: Knex,
    auditService: AuditService,
  ) {
    super(knex, auditService, {
      tableName: 'facts',
      auditEntityType: 'Fact',
      primaryKey: 'fact_id',
      hasUpdatedAt: true,
    });
  }

  protected domainToRecord(domain: Partial<Fact>): Partial<FactRecord> {
    const record: Partial<FactRecord> = {};
    if (domain.key !== undefined) record.key = this.normalizeKey(domain.key);
    if (domain.value !== undefined) record.value = domain.value;
    if (domain.ownerUserId !== undefined) record.owner_user_id = domain.ownerUserId;
    if (domain.visibilityRoles !== undefined) record.visibility_roles = domain.visibilityRoles;
    return record;
  }

  protected recordToDomain(record: FactRecord): Fact {
    return {
      factId: record.fact_id,
      key: this.unnormalizeKey(record.key),
      value: record.value,
      ownerUserId: record.owner_user_id,
      visibilityRoles: record.visibility_roles,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  /**
   * Normalizes keys for consistent storage and lookup.
   * - Lowercase
   * - Replaces spaces with underscores
   * - Trims whitespace
   */
  private normalizeKey(key: string): string {
    return key.toLowerCase().trim().replace(/\s+/g, '_');
  }

  /**
   * Un-normalizes keys for the business/domain layer (human-readable form).
   * Reverses normalization: underscores → spaces, with title casing.
   */
  private unnormalizeKey(key: string): string {
    return key
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Store or update a fact (UPSERT on key). Matches service business logic.
   */
  async storeFact(
    key: string,
    value: string,
    ownerUserId?: string | null,
    visibilityRoles: string = 'parent,child',
  ): Promise<Fact> {
    const normalizedKey = this.normalizeKey(key);
    const domain: Partial<Fact> = {
      key: normalizedKey,
      value: value.trim(),
      ownerUserId: ownerUserId || null,
      visibilityRoles,
    };
    // Use update or create based on existence (or use Knex onConflict for efficiency)
    const existing = await this.findOneBy({ key: normalizedKey } as any);
    if (existing) {
      return this.update(existing.factId!, domain);
    }
    return this.create(domain as Omit<Fact, 'factId'>);
  }

  async retrieveFact(key: string): Promise<Fact | null> {
    const normalizedKey = this.normalizeKey(key);
    return this.findOneBy({ key: normalizedKey } as any);
  }

  async deleteFact(key: string): Promise<boolean> {
    const normalizedKey = this.normalizeKey(key);
    const count = await this.knex(this.tableName).where('key', normalizedKey).del();
    if (count > 0) {
      await this.logAudit('DELETE', normalizedKey, { old: { key: normalizedKey } });
    }
    return count > 0;
  }
}
