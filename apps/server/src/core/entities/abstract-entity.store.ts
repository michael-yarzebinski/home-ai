import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { Knex } from 'knex';
import { AuditService } from './monitoring/audit/audit.service';
import { KNEX_CONNECTION, EntityStoreOptions } from '../database/knex.constants';
import { Audit } from './monitoring/audit/audit.domain';
import { v4 } from 'uuid';

@Injectable()
export abstract class AbstractEntityStore<
  RecordType extends Record<string, any> = any,
  DomainType extends Record<string, any> = any,
> {
  protected readonly knex: Knex;
  protected readonly auditService?: AuditService;

  protected readonly tableName: string;
  protected readonly auditEntityType?: string;
  protected readonly hasUpdatedAt: boolean;
  protected readonly hasActiveFlag: boolean;
  protected readonly isAuditingEnabled: boolean;

  constructor(
    @Inject(KNEX_CONNECTION) knex: Knex,
    auditService: AuditService | undefined,
    options: EntityStoreOptions,
  ) {
    this.knex = knex;
    this.auditService = auditService;

    this.tableName = options.tableName;
    this.auditEntityType = options.auditEntityType;
    this.hasUpdatedAt = options.hasUpdatedAt ?? false;
    this.hasActiveFlag = options.hasActiveFlag ?? false;
    this.isAuditingEnabled = options.isAuditingEnabled ?? true;
  }

  async _getById(id: string | number, includeInactive: boolean = false): Promise<RecordType> {
    let query = this.baseQuery();
    if (this.hasActiveFlag && !includeInactive) {
      query = this.activeOnly(query);
    }

    const record = await query.where('id', id).first();
    if (!record) {
      throw new BadRequestException(`Could not find entity with id ${id}.`)
    }

    return record;
  }

  /**
   * Convert business domain object (camelCase) → DB record (snake_case)
   */
  protected abstract domainToRecord(domain: Partial<DomainType>): Partial<RecordType>;

  /**
   * Convert DB record (snake_case) → business domain object (camelCase)
   */
  protected abstract recordToDomain(record: RecordType): DomainType;

  protected searchQuery?(search: string, query: Knex.QueryBuilder<RecordType>) : Knex.QueryBuilder<RecordType>;

  protected getEntityId(record: RecordType | DomainType): string | number {
    return (record as any).id ?? 'unknown';
  }

  /**
   * Base query builder (returns raw Knex query for flexibility)
   */
  protected baseQuery(): Knex.QueryBuilder<RecordType> {
    return this.knex<RecordType>(this.tableName);
  }

  protected activeOnly(query: Knex.QueryBuilder<RecordType>) {
    return query.where('active', true);
  }

  async search(search?: string, skip?: number, take?: number, includeInactive?: boolean) {
    let query = this.baseQuery();
    if (this.hasActiveFlag && !includeInactive) {
      query = this.activeOnly(query);
    }

    if (search && this.searchQuery) {
      query = this.searchQuery(search, query);
    }

    const countResult = await query
    .clone()
    .count({ total: '*' })
    .first<{ total: string | number }>();

    const total = countResult ? Number(countResult.total) || 0 : 0;

    if (skip !== undefined && take !== undefined) {
      query = query.offset(skip).limit(take);
    }

    const records = await query.orderBy('created_at', 'desc').select('*') as RecordType[];

    return {
      data: records.map(r => this.recordToDomain(r)),
      total,
    }
  }

  /**
   * Find ALL records (including inactive ones)
   */
  async getAll(includeInactive: boolean = false): Promise<DomainType[]> {
    const searchResult = await this.search(undefined, undefined, undefined, includeInactive);

    return searchResult.data
  }

  /**
   * Find by primary key with optional includeInactive flag
   * Default: only returns active records when hasActiveFlag = true
   */
  async getById(id: string | number, includeInactive: boolean = false): Promise<DomainType> {
    const record = await this._getById(id, includeInactive);
    if (!record) {
      throw new BadRequestException(`Could not find entity by id ${id}.`)
    }
    return this.recordToDomain(record);
  }

  /**
   * Create a new entity
   */
  async create(domain: Partial<DomainType>): Promise<DomainType> {
    const record = this.domainToRecord(domain);

    if (this.hasActiveFlag && (record as any).active === undefined) {
      (record as any).active = true;
    }

    const [createdRecord] = await this.knex(this.tableName)
      .insert(record)
      .returning('*') as [RecordType];

    const entityId = this.getEntityId(createdRecord);

    await this.logAudit('CREATE', entityId, { new: createdRecord });

    return this.recordToDomain(createdRecord);
  }

  private async _update(existingRecord: RecordType, updates: Partial<RecordType>) : Promise<DomainType> {
    if (this.hasUpdatedAt) {
      (updates as any).updated_at = this.knex.fn.now();
    }

    const updatedRecord = (await this.baseQuery().where('id', this.getEntityId(existingRecord)).update(updates as any).returning('*'))[0] as RecordType;
    await this.logAudit('UPDATE', this.getEntityId(existingRecord), { old: existingRecord, new: updatedRecord });

    return this.recordToDomain(updatedRecord);
  }

  /**
   * Update an existing entity
   */
  async update(id: string | number, updates: Partial<DomainType>): Promise<DomainType> {
    const existingRecord = await this._getById(id, false);
    if (!existingRecord) {
      throw new BadRequestException(`Record could not be found for ${id}. Could not perform update.`)
    }

    const recordUpdates = this.domainToRecord(updates);
    return await this._update(existingRecord, recordUpdates);
  }

  /**
   * Toggle active status (soft enable/disable)
   */
  async setActive(id: string | number, active: boolean): Promise<DomainType> {
    if (!this.hasActiveFlag) {
      throw new BadRequestException(`Table ${this.tableName} does not support active flag`);
    }

    const existingRecord = await this._getById(id, true);

    return this._update(existingRecord, {active} as unknown as RecordType);
  }

  async delete(id: string | number): Promise<number> {
    const existingRecord = await this._getById(id, true);
    const deleted = await this.baseQuery().where('id', this.getEntityId(existingRecord)).del();
    await this.logAudit('DELETE', this.getEntityId(existingRecord), { old: existingRecord });
    return deleted;
  }

  /**
   * Protected audit logging
   */
  protected async logAudit(action: 'CREATE' | 'UPDATE' | 'DELETE', entityId: string | number, changes?: { old?: any; new?: any }): Promise<void> {
    if (!this.isAuditingEnabled || !this.auditService || !this.auditEntityType) {
      return;
    }

    try {
      const logEntry: Audit = {
        id: v4(),
        entityType: this.auditEntityType,
        entityId: entityId.toString(),
        action,
        changes,
        metadata: { table: this.tableName },
        timestamp: new Date(),
      };

      await this.auditService.log(logEntry);
    } catch (error) {}
  }
}